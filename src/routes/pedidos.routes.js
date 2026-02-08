import { Router } from 'express';
import { client } from '../db.js';

const router = Router();

// --- POST: Crear pedido (Con Numeración Inteligente y Asignación de Usuario) ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    // El front puede mandar 'items' o 'productos', aquí lo normalizamos
    const { cliente, items, productos, total, metodoPago, fecha } = req.body;
    const listaProductos = productos || items; // Soporta ambos nombres

    if (!usuarioId) {
        return res.status(400).json({ error: "No se puede crear pedido sin usuario asignado" });
    }

    try {
        // --- 🧠 LÓGICA DE NUMERACIÓN INTELIGENTE (Rellena-Huecos) ---
        // 1. Traemos todos los números de pedido ocupados por ESTE usuario
        const idsResult = await client.execute({
            sql: "SELECT numero_pedido FROM pedidos WHERE usuario_id = ? ORDER BY numero_pedido ASC",
            args: [usuarioId]
        });

        // 2. Calculamos cuál es el primer número disponible
        let proximoNumero = 1;
        const numerosOcupados = idsResult.rows.map(r => r.numero_pedido);

        for (let num of numerosOcupados) {
            // Si encontramos el número que esperábamos (ej: esperamos 1 y está el 1),
            // incrementamos el contador para buscar el siguiente.
            if (num === proximoNumero) {
                proximoNumero++;
            } else {
                // Si esperábamos el 2 pero encontramos el 3... ¡El 2 está libre!
                // Cortamos el bucle y usamos el 2.
                break;
            }
        }
        // --- FIN LÓGICA ---

        const fechaFinal = fecha || new Date().toISOString();

        // INSERTAMOS CON EL usuario_id Y EL numero_pedido CALCULADO
        const result = await client.execute({
            sql: `INSERT INTO pedidos (cliente, productos, total, estado, metodoPago, fecha, usuario_id, numero_pedido) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                  RETURNING *`,
            args: [
                cliente || 'Consumidor Final',
                typeof listaProductos === 'string' ? listaProductos : JSON.stringify(listaProductos),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal,
                usuarioId, // <--- SELLO DEL DUEÑO
                proximoNumero // <--- NÚMERO INTELIGENTE
            ]
        });

        const nuevoPedido = result.rows[0];

        // Parseamos los productos para devolverlos como objeto al front
        let productosParsed = [];
        try {
            productosParsed = typeof nuevoPedido.productos === 'string' ? JSON.parse(nuevoPedido.productos) : nuevoPedido.productos;
        } catch (e) {
            productosParsed = [];
        }

        res.status(201).json({
            ...nuevoPedido,
            productos: productosParsed,
            numeroPedido: proximoNumero // Devolvemos explícitamente el número generado
        });

    } catch (error) {
        console.error("❌ Error al guardar pedido:", error.message);
        res.status(500).json({
            error: "Error de base de datos",
            detalle: error.message
        });
    }
});

// --- GET: Obtener pedidos DEL USUARIO ACTUAL ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    if (!usuarioId) {
        return res.status(400).json({ error: "Falta identificación de usuario (x-user-id)" });
    }

    try {
        // FILTRO CLAVE: WHERE usuario_id = ?
        // Ordenamos por numero_pedido para que se vea 1, 2, 3...
        const result = await client.execute({
            sql: "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY numero_pedido ASC",
            args: [usuarioId]
        });

        const pedidos = result.rows.map(row => {
            // LÓGICA ROBUSTA PARA EVITAR ERROR 500 SI EL JSON ESTÁ ROTO
            let productosParsed = [];
            try {
                productosParsed = typeof row.productos === 'string'
                    ? JSON.parse(row.productos)
                    : (row.productos || []);
            } catch (e) {
                console.warn(`⚠️ Error parseando productos del pedido ${row.id}`, e);
                productosParsed = []; // Si falla, devolvemos array vacío en vez de romper todo
            }

            return {
                ...row,
                productos: productosParsed,
                numeroPedido: row.numero_pedido || 0 // Mapeamos para el frontend
            };
        });

        res.json(pedidos);
    } catch (error) {
        console.error("❌ Error al obtener pedidos:", error);
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
});

// --- PATCH: Actualizar estado (Solo si es tu pedido) ---
router.patch('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    const { estado } = req.body;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ?
        const result = await client.execute({
            sql: "UPDATE pedidos SET estado = ? WHERE id = ? AND usuario_id = ?",
            args: [estado, id, usuarioId]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Pedido no encontrado o no te pertenece" });
        }

        res.json({ success: true, id, nuevoEstado: estado });
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
        res.status(500).json({ error: "No se pudo actualizar el estado" });
    }
});

// --- DELETE: Eliminar pedido (Solo si es tuyo) ---
router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ?
        const result = await client.execute({
            sql: "DELETE FROM pedidos WHERE id = ? AND usuario_id = ?",
            args: [id, usuarioId]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Pedido no encontrado o no te pertenece" });
        }

        res.json({ success: true, message: "Pedido eliminado" });
    } catch (error) {
        console.error("❌ Error al eliminar pedido:", error);
        res.status(500).json({ error: "No se pudo eliminar el pedido" });
    }
});

export default router;
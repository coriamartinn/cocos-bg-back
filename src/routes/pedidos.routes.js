import { Router } from 'express';
import { client } from '../db.js';

const router = Router();

// --- POST: Crear pedido (Asignado al usuario) ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    // El front puede mandar 'items' o 'productos', aquí lo normalizamos
    const { cliente, items, productos, total, metodoPago, fecha } = req.body;
    const listaProductos = productos || items; // Soporta ambos nombres

    if (!usuarioId) {
        return res.status(400).json({ error: "No se puede crear pedido sin usuario asignado" });
    }

    try {
        const fechaFinal = fecha || new Date().toISOString();

        // INSERTAMOS CON EL usuario_id
        const result = await client.execute({
            sql: `INSERT INTO pedidos (cliente, productos, total, estado, metodoPago, fecha, usuario_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?) 
                  RETURNING *`,
            args: [
                cliente || 'Consumidor Final',
                typeof listaProductos === 'string' ? listaProductos : JSON.stringify(listaProductos),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal,
                usuarioId // <--- SELLO DEL DUEÑO
            ]
        });

        const nuevoPedido = result.rows[0];

        // Parseamos los productos para devolverlos como objeto al front
        res.status(201).json({
            ...nuevoPedido,
            productos: typeof nuevoPedido.productos === 'string' ? JSON.parse(nuevoPedido.productos) : nuevoPedido.productos
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
        const result = await client.execute({
            sql: "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id ASC",
            args: [usuarioId]
        });

        const pedidos = result.rows.map(row => ({
            ...row,
            // Nos aseguramos de parsear el JSON de productos
            productos: typeof row.productos === 'string' ? JSON.parse(row.productos) : row.productos
        }));

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
import { Router } from 'express';
import { client } from '../db.js';

const router = Router();

// --- POST: Crear pedido ---
router.post('/', async (req, res) => {
    // El front puede mandar 'items' o 'productos', aquí lo normalizamos
    const { cliente, items, productos, total, metodoPago, fecha } = req.body;
    const listaProductos = productos || items; // Soporta ambos nombres

    try {
        const fechaFinal = fecha || new Date().toISOString();

        // Eliminé 'numeroPedido' de la consulta porque usamos el 'id' autoincremental
        const result = await client.execute({
            sql: `INSERT INTO pedidos (cliente, productos, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?) 
                  RETURNING *`,
            args: [
                cliente || 'Consumidor Final',
                typeof listaProductos === 'string' ? listaProductos : JSON.stringify(listaProductos),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal
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

// --- GET: Obtener todos los pedidos ---
router.get('/', async (req, res) => {
    try {
        const result = await client.execute("SELECT * FROM pedidos ORDER BY id ASC");

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

// --- PATCH: Actualizar estado ---
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const result = await client.execute({
            sql: "UPDATE pedidos SET estado = ? WHERE id = ?",
            args: [estado, id]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        res.json({ success: true, id, nuevoEstado: estado });
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
        res.status(500).json({ error: "No se pudo actualizar el estado" });
    }
});

// --- DELETE: Eliminar pedido ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.execute({
            sql: "DELETE FROM pedidos WHERE id = ?",
            args: [id]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        res.json({ success: true, message: "Pedido eliminado" });
    } catch (error) {
        console.error("❌ Error al eliminar pedido:", error);
        res.status(500).json({ error: "No se pudo eliminar el pedido" });
    }
});

export default router;
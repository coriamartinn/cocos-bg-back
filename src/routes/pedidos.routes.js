import { Router } from 'express';
import client from '../db.js';

const router = Router();

// --- POST: Guardar un nuevo pedido ---
router.post('/', async (req, res) => {
    const { cliente, items, total, metodoPago } = req.body;
    try {
        const numeroPedido = `CC-${Math.floor(Math.random() * 9000) + 1000}`;
        const result = await client.execute({
            sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                numeroPedido,
                cliente || 'Consumidor Final',
                JSON.stringify(items),
                total,
                'pendiente',
                metodoPago
            ]
        });

        res.status(201).json({
            id: result.lastInsertRowid?.toString(),
            numeroPedido,
            cliente,
            items,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error al guardar pedido:", error);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

// --- GET: Obtener todos los pedidos ---
router.get('/', async (req, res) => {
    try {
        const result = await client.execute("SELECT * FROM pedidos ORDER BY fecha DESC");
        const pedidos = result.rows.map(row => ({
            ...row,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        }));
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
});

// --- PATCH: Actualizar estado del pedido (Cocina) ---
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await client.execute({
            sql: "UPDATE pedidos SET estado = ? WHERE id = ?",
            args: [estado, id]
        });
        res.json({ success: true, id, nuevoEstado: estado });
    } catch (error) {
        res.status(500).json({ error: "No se pudo actualizar el estado" });
    }
});

// --- DELETE: Eliminar pedido (Cancelar o Limpiar) ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await client.execute({
            sql: "DELETE FROM pedidos WHERE id = ?",
            args: [id]
        });
        res.json({ success: true, message: "Pedido eliminado" });
    } catch (error) {
        res.status(500).json({ error: "No se pudo eliminar el pedido" });
    }
});

export default router;
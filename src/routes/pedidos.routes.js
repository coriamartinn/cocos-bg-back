import { Router } from 'express'; // 1. IMPORTANTE: Importar Router
import { client } from '../db.js'; // Asegurate que la ruta a db.js sea correcta

const router = Router(); // 2. IMPORTANTE: Definir la variable router

// --- POST: Guardar un nuevo pedido ---
router.post('/', async (req, res) => {
    const { cliente, items, total, metodoPago, numeroPedido, fecha } = req.body;

    try {
        const fechaFinal = fecha || new Date().toISOString();
        const numeroFinal = numeroPedido || `CC-${Math.floor(Math.random() * 9000) + 1000}`;

        const result = await client.execute({
            sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                numeroFinal,
                cliente || 'Consumidor Final',
                typeof items === 'string' ? items : JSON.stringify(items),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal
            ]
        });

        res.status(201).json({
            id: result.lastInsertRowid?.toString(),
            numeroPedido: numeroFinal,
            cliente: cliente || 'Consumidor Final',
            items: typeof items === 'string' ? JSON.parse(items) : items,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaFinal
        });
    } catch (error) {
        console.error("Error al guardar pedido:", error.message);
        res.status(500).json({ error: "Error de base de datos", detalle: error.message });
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

// --- PATCH: Actualizar estado ---
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

// --- DELETE: Eliminar pedido ---
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

export default router; // 3. IMPORTANTE: Exportar el router
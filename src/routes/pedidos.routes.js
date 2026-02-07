import { Router } from 'express';
import { client } from '../db.js';

const router = Router();

// --- POST: Crear pedido (La DB asigna el ID automáticamente) ---
router.post('/', async (req, res) => {
    const { cliente, items, total, metodoPago, fecha } = req.body;

    try {
        const fechaFinal = fecha || new Date().toISOString();

        // No enviamos 'id' ni 'numeroPedido', la DB usa el AUTOINCREMENT del id
        const result = await client.execute({
            sql: `INSERT INTO pedidos (cliente, items, total, estado, metodoPago, fecha, numeroPedido) 
                  VALUES (?, ?, ?, ?, ?, ?, ?) 
                  RETURNING *`, // <--- Esto nos devuelve el pedido completo con el ID real
            args: [
                cliente || 'Consumidor Final',
                typeof items === 'string' ? items : JSON.stringify(items),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal,
                'TEMP' // Podemos usar una columna temporal o simplemente usar el ID como número
            ]
        });

        const nuevoPedido = result.rows[0];

        // Opcional: Si querés que el número de pedido visual sea igual al ID
        // Podemos hacer un pequeño update o simplemente manejarlo en el front

        res.status(201).json({
            ...nuevoPedido,
            items: typeof nuevoPedido.items === 'string' ? JSON.parse(nuevoPedido.items) : nuevoPedido.items
        });
    } catch (error) {
        console.error("Error al guardar pedido:", error.message);
        res.status(500).json({ error: "Error de base de datos", detalle: error.message });
    }
});

// --- GET: Obtener todos los pedidos ---
router.get('/', async (req, res) => {
    try {
        const result = await client.execute("SELECT * FROM pedidos ORDER BY id ASC");
        const pedidos = result.rows.map(row => ({
            ...row,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        }));
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
});

// --- PATCH: Actualizar estado (Usando el ID numérico de la DB) ---
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

// --- DELETE: Eliminar pedido (Usando el ID numérico de la DB) ---
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
        res.status(500).json({ error: "No se pudo eliminar el pedido" });
    }
});

export default router;
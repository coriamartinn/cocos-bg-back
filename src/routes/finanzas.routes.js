import { Router } from 'express';
import { client } from '../db.js';
import crypto from 'crypto';

const router = Router();

// --- GET: Obtener historial de movimientos ---
router.get('/', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener finanzas" });
    }
});

// --- POST: Lógica de Cierre de Caja ---
router.post('/cierre', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 1. Guardamos el resumen en la tabla 'cierres' para tener un historial
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad]
        });

        // 2. Registramos el movimiento en 'finanzas' (para el balance general)
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidad} pedidos`, total, 'ingreso']
        });

        // 3. AQUÍ ESTÁ LA LÓGICA DE BORRADO:
        // Vaciamos la tabla de pedidos del día
        await client.execute("DELETE FROM pedidos");

        // 4. RESET DEL CONTADOR:
        // Esto hace que el próximo pedido que entre sea el #1
        await client.execute("DELETE FROM sqlite_sequence WHERE name='pedidos'");

        res.json({
            success: true,
            message: "Cierre completado. Pedidos borrados y contador reseteado a 1."
        });

    } catch (error) {
        console.error("Error en el proceso de cierre:", error);
        res.status(500).json({ error: "Fallo en el servidor al procesar el cierre" });
    }
});

export default router;
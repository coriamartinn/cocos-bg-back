import { Router } from 'express';
import { client } from '../db.js';
import crypto from 'crypto';

const router = Router();

// --- 1. GET: Obtener historial de movimientos (Ingresos y Egresos) ---
router.get('/', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
        console.error("Error al obtener finanzas:", error);
        res.status(500).json({ error: "Error al obtener finanzas" });
    }
});

// --- 2. POST: Registrar un movimiento manual (Gasto de insumos o Ingreso extra) ---
router.post('/', async (req, res) => {
    const { descripcion, monto, tipo, fecha } = req.body;

    try {
        // Validamos que vengan los datos mínimos
        if (!descripcion || !monto || !tipo) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const id = crypto.randomUUID();
        const fechaFinal = fecha || new Date().toISOString();

        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [id, fechaFinal, descripcion, monto, tipo]
        });

        // Devolvemos el objeto creado para que el front lo agregue al estado
        res.status(201).json({
            id,
            fecha: fechaFinal,
            descripcion,
            monto,
            tipo
        });
    } catch (error) {
        console.error("Error al registrar movimiento:", error);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

// --- 3. DELETE: Eliminar un registro de finanzas por ID ---
// IMPORTANTE: Esto es lo que faltaba para que el botón de basura funcione
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.execute({
            sql: "DELETE FROM finanzas WHERE id = ?",
            args: [id]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        res.json({ success: true, message: "Registro eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        res.status(500).json({ error: "No se pudo eliminar el registro" });
    }
});

// --- 4. POST: Lógica de Cierre de Caja (Proceso diario) ---
router.post('/cierre', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 1. Guardamos el resumen del día en la tabla histórica de cierres
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad]
        });

        // 2. Registramos el ingreso en el balance general de finanzas
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidad} pedidos`, total, 'ingreso']
        });

        // 3. Borramos los pedidos activos del día
        await client.execute("DELETE FROM pedidos");

        // 4. Reset del contador AUTOINCREMENT para que mañana empiece del #1
        await client.execute("DELETE FROM sqlite_sequence WHERE name='pedidos'");

        res.json({
            success: true,
            message: "Cierre completado. Pedidos borrados y contador reseteado."
        });

    } catch (error) {
        console.error("Error en el proceso de cierre:", error);
        res.status(500).json({ error: "Fallo crítico en el cierre de caja" });
    }
});

export default router;
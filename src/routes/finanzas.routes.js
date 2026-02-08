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

// Ruta para actualizar un movimiento
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { descripcion, monto, tipo } = req.body;

    try {
        await client.execute({
            sql: "UPDATE finanzas SET descripcion = ?, monto = ?, tipo = ? WHERE id = ?",
            args: [descripcion.trim(), Number(monto), tipo, id]
        });
        res.json({ success: true, message: "Movimiento actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});



export default router;
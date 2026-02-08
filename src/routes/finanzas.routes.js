import { Router } from 'express';
import { client } from '../db.js';
import crypto from 'crypto';

const router = Router();

// --- 1. GET: Obtener historial (SOLO del usuario actual) ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    if (!usuarioId) {
        return res.status(400).json({ error: "Falta identificación de usuario (x-user-id)" });
    }

    try {
        // FILTRO CLAVE: WHERE usuario_id = ?
        const rs = await client.execute({
            sql: "SELECT * FROM finanzas WHERE usuario_id = ? ORDER BY fecha DESC",
            args: [usuarioId]
        });

        res.json(rs.rows);
    } catch (error) {
        console.error("Error al obtener finanzas:", error);
        res.status(500).json({ error: "Error al obtener finanzas" });
    }
});

// --- 2. POST: Registrar movimiento (Asignado al usuario) ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { descripcion, monto, tipo, fecha } = req.body;

    if (!usuarioId) {
        return res.status(400).json({ error: "No se puede registrar sin usuario asignado" });
    }

    try {
        if (!descripcion || !monto || !tipo) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const id = crypto.randomUUID();
        const fechaFinal = fecha || new Date().toISOString();

        // INSERTAMOS CON EL usuario_id
        await client.execute({
            sql: `INSERT INTO finanzas (id, fecha, descripcion, monto, tipo, usuario_id) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                fechaFinal,
                descripcion,
                monto,
                tipo,
                usuarioId // <--- SELLO DEL DUEÑO
            ]
        });

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

// --- 3. DELETE: Eliminar movimiento (Solo si es tuyo) ---
router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ?
        const result = await client.execute({
            sql: "DELETE FROM finanzas WHERE id = ? AND usuario_id = ?",
            args: [id, usuarioId]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Registro no encontrado o no te pertenece" });
        }

        res.json({ success: true, message: "Registro eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        res.status(500).json({ error: "No se pudo eliminar el registro" });
    }
});

// --- 4. PUT: Actualizar movimiento (Solo si es tuyo) ---
router.put('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    const { descripcion, monto, tipo } = req.body;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ?
        await client.execute({
            sql: `UPDATE finanzas SET descripcion = ?, monto = ?, tipo = ? 
                  WHERE id = ? AND usuario_id = ?`,
            args: [
                descripcion.trim(),
                Number(monto),
                tipo,
                id,
                usuarioId // <--- IMPORTANTE
            ]
        });

        res.json({ success: true, message: "Movimiento actualizado" });
    } catch (error) {
        console.error("Error en PUT finanzas:", error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

export default router;
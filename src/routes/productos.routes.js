import { Router } from 'express';
import { client } from '../db.js'; // 👈 Asegurate que sea { client } si exportas así en db.js
import crypto from 'crypto';

const router = Router();

// --- GET: Obtener menú del usuario ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    if (!usuarioId) return res.status(400).json({ error: "Falta identificación de usuario" });

    try {
        const result = await client.execute({
            sql: "SELECT * FROM productos WHERE usuario_id = ?",
            args: [usuarioId]
        });

        const productos = result.rows.map(row => ({
            ...row,
            tamanos: typeof row.tamanos === 'string' ? JSON.parse(row.tamanos) : (row.tamanos || null)
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error GET productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// --- POST: Crear producto ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    // Recibimos 'tamanos' (con ñ o n, idealmente usá n para código)
    const { nombre, precio, categoria, imagen, tamanos, descripcion } = req.body;
    const id = crypto.randomUUID();

    if (!usuarioId) return res.status(400).json({ error: "Falta usuario" });
    if (!nombre) return res.status(400).json({ error: "Nombre obligatorio" });

    try {
        // Preparamos el JSON de tamaños (si es null, guardamos null o empty string)
        const tamanosStr = tamanos ? JSON.stringify(tamanos) : null;

        await client.execute({
            sql: `INSERT INTO productos (id, nombre, precio, categoria, imagen, tamanos, descripcion, usuario_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                nombre.trim(),
                Number(precio),
                categoria || 'BURGER',
                imagen || '',
                tamanosStr,
                descripcion || '',
                usuarioId
            ]
        });

        res.status(201).json({ id, nombre, precio, categoria, imagen, tamanos, descripcion });
    } catch (error) {
        console.error("Error POST productos:", error);
        res.status(500).json({ error: "No se pudo crear" });
    }
});

// --- PUT: Editar producto ---
router.put('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    const { nombre, precio, categoria, imagen, tamanos, descripcion } = req.body;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        const tamanosStr = tamanos ? JSON.stringify(tamanos) : null;

        const result = await client.execute({
            sql: `UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ?, tamanos = ?, descripcion = ?
                  WHERE id = ? AND usuario_id = ?`,
            args: [
                nombre.trim(),
                Number(precio),
                categoria,
                imagen || '',
                tamanosStr,
                descripcion || '',
                id,
                usuarioId
            ]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error PUT productos:", error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// --- DELETE: Borrar producto ---
router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        const result = await client.execute({
            sql: "DELETE FROM productos WHERE id = ? AND usuario_id = ?",
            args: [id, usuarioId]
        });

        if (result.rowsAffected === 0) return res.status(404).json({ error: "No encontrado" });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

export default router;
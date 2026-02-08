import { Router } from 'express';
import client from '../db.js';
import crypto from 'crypto';

const router = Router();

// --- GET: Obtener SOLO los productos del usuario actual ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];

    if (!usuarioId) {
        return res.status(400).json({ error: "Falta identificación de usuario (x-user-id)" });
    }

    try {
        // FILTRO CLAVE: WHERE usuario_id = ?
        const result = await client.execute({
            sql: "SELECT * FROM productos WHERE usuario_id = ?",
            args: [usuarioId]
        });

        const productos = result.rows.map(row => ({
            ...row,
            tamanos: typeof row.tamanos === 'string' ? JSON.parse(row.tamanos) : (row.tamanos || [])
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error en GET productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// --- POST: Agregar producto ASIGNADO al usuario ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { nombre, precio, categoria, imagen, tamanos } = req.body;
    const id = crypto.randomUUID();

    if (!usuarioId) {
        return res.status(400).json({ error: "No se puede crear producto sin usuario asignado" });
    }

    try {
        if (!nombre || !precio) {
            return res.status(400).json({ error: "Nombre y precio son obligatorios" });
        }

        // INSERTAMOS CON EL usuario_id
        await client.execute({
            sql: `INSERT INTO productos (id, nombre, precio, categoria, imagen, tamanos, usuario_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                nombre.trim(),
                Number(precio),
                categoria || 'BURGER',
                imagen || '',
                JSON.stringify(tamanos || []),
                usuarioId // <--- EL SELLO DEL DUEÑO
            ]
        });

        res.status(201).json({ id, nombre, precio, categoria, imagen, tamanos });
    } catch (error) {
        console.error("Error en POST productos:", error);
        res.status(500).json({ error: "No se pudo crear el producto" });
    }
});

// --- PUT: Editar producto (Solo si es tuyo) ---
router.put('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    const { nombre, precio, categoria, imagen, tamanos } = req.body;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ? (Para que Pepe no edite la hamburguesa de Juan)
        const result = await client.execute({
            sql: `UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ?, tamanos = ? 
                  WHERE id = ? AND usuario_id = ?`,
            args: [
                nombre.trim(),
                Number(precio),
                categoria,
                imagen || '',
                JSON.stringify(tamanos || []),
                id,
                usuarioId // <--- IMPORTANTE
            ]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Producto no encontrado o no te pertenece" });
        }

        res.json({ success: true, message: "Producto actualizado correctamente" });
    } catch (error) {
        console.error("Error en PUT productos:", error);
        res.status(500).json({ error: "No se pudo actualizar el producto" });
    }
});

// --- DELETE: Eliminar producto (Solo si es tuyo) ---
router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!usuarioId) return res.status(401).json({ error: "Acceso denegado" });

    try {
        // SEGURIDAD: AND usuario_id = ?
        const result = await client.execute({
            sql: "DELETE FROM productos WHERE id = ? AND usuario_id = ?",
            args: [id, usuarioId]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Producto no encontrado o no te pertenece" });
        }

        res.json({ success: true, message: "Producto eliminado del menú" });
    } catch (error) {
        console.error("Error en DELETE productos:", error);
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
});

export default router;
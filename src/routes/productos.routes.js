import { Router } from 'express';
import client from '../db.js';
import crypto from 'crypto';

const router = Router();

// --- GET: Obtener todos los productos ---
router.get('/', async (req, res) => {
    try {
        const result = await client.execute("SELECT * FROM productos");

        const productos = result.rows.map(row => ({
            ...row,
            // Manejo seguro del parseo de tamaños
            tamanos: typeof row.tamanos === 'string' ? JSON.parse(row.tamanos) : row.tamanos
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error en GET productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// --- POST: Agregar un nuevo producto (ej: una nueva burger especial) ---
router.post('/', async (req, res) => {
    const { nombre, precio, categoria, imagen, tamanos } = req.body;
    const id = crypto.randomUUID();

    try {
        await client.execute({
            sql: `INSERT INTO productos (id, nombre, precio, categoria, imagen, tamanos) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [id, nombre, precio, categoria, imagen, JSON.stringify(tamanos)]
        });
        res.status(201).json({ id, nombre, precio, categoria, imagen, tamanos });
    } catch (error) {
        res.status(500).json({ error: "No se pudo crear el producto" });
    }
});

// --- PUT: Editar un producto existente (ej: actualizar precios por inflación) ---
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, categoria, imagen, tamanos } = req.body;

    try {
        await client.execute({
            sql: `UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ?, tamanos = ? 
            WHERE id = ?`,
            args: [nombre, precio, categoria, imagen, JSON.stringify(tamanos), id]
        });
        res.json({ success: true, message: "Producto actualizado" });
    } catch (error) {
        res.status(500).json({ error: "No se pudo actualizar el producto" });
    }
});

// --- DELETE: Eliminar un producto ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await client.execute({
            sql: "DELETE FROM productos WHERE id = ?",
            args: [id]
        });
        res.json({ success: true, message: "Producto eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
});

export default router;
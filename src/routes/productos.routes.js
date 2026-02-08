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
            // Parseo seguro: si es string lo convierte a objeto, si no, lo deja como está
            tamanos: typeof row.tamanos === 'string' ? JSON.parse(row.tamanos) : (row.tamanos || [])
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error en GET productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// --- POST: Agregar un nuevo producto (Gestión directa desde la web) ---
router.post('/', async (req, res) => {
    const { nombre, precio, categoria, imagen, tamanos } = req.body;
    const id = crypto.randomUUID();

    try {
        // Validamos que los datos mínimos existan
        if (!nombre || !precio) {
            return res.status(400).json({ error: "Nombre y precio son obligatorios" });
        }

        await client.execute({
            sql: `INSERT INTO productos (id, nombre, precio, categoria, imagen, tamanos) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                nombre.trim(),
                Number(precio),
                categoria || 'BURGER',
                imagen || '',
                JSON.stringify(tamanos || [])
            ]
        });

        res.status(201).json({ id, nombre, precio, categoria, imagen, tamanos });
    } catch (error) {
        console.error("Error en POST productos:", error);
        res.status(500).json({ error: "No se pudo crear el producto" });
    }
});

// --- PUT: Editar un producto existente ---
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, categoria, imagen, tamanos } = req.body;

    try {
        const result = await client.execute({
            sql: `UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ?, tamanos = ? 
                  WHERE id = ?`,
            args: [
                nombre.trim(),
                Number(precio),
                categoria,
                imagen || '',
                JSON.stringify(tamanos || []),
                id
            ]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ success: true, message: "Producto actualizado correctamente" });
    } catch (error) {
        console.error("Error en PUT productos:", error);
        res.status(500).json({ error: "No se pudo actualizar el producto" });
    }
});

// --- DELETE: Eliminar un producto ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.execute({
            sql: "DELETE FROM productos WHERE id = ?",
            args: [id]
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ success: true, message: "Producto eliminado del menú" });
    } catch (error) {
        console.error("Error en DELETE productos:", error);
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
});

export default router;
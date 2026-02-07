import { Router } from 'express';
import client from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM productos");
    
    // Mapeamos para que el Front reciba los tamaños como objeto y no como string
    const productos = result.rows.map(row => ({
      ...row,
      tamanos: row.tamanos ? JSON.parse(row.tamanos) : null
    }));
    
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

export default router;
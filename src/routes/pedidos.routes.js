import { Router } from 'express';
import client from '../db.js';

const router = Router();

// POST: Guardar un nuevo pedido desde la POS
router.post('/', async (req, res) => {
  const { cliente, items, total, notas, metodoPago } = req.body;

  try {
    // Generamos un número de pedido simple (podes mejorarlo después)
    const numeroPedido = `CC-${Math.floor(Math.random() * 9000) + 1000}`;

    const result = await client.execute({
      sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        numeroPedido,
        cliente || 'Consumidor Final',
        JSON.stringify(items), // Convertimos el array del front a texto para la DB
        total,
        'pendiente',
        metodoPago
      ]
    });

    // Retornamos el pedido como lo espera tu frontend
    res.status(201).json({
      id: result.lastInsertRowid.toString(),
      numeroPedido,
      cliente,
      items,
      total,
      estado: 'pendiente',
      metodoPago,
      fecha: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al guardar pedido:", error);
    res.status(500).json({ error: "No se pudo registrar el pedido en la base de datos." });
  }
});

// GET: Obtener todos los pedidos (Para la futura pantalla de cocina)
router.get('/', async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM pedidos ORDER BY fecha DESC");
    const pedidos = result.rows.map(row => ({
      ...row,
      items: JSON.parse(row.items) // Devolvemos objetos al front
    }));
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

export default router;
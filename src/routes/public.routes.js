import express from 'express';
import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

// GET /api/public/menu/:usuario_id
router.get('/menu/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;

    console.log(`📡 Solicitud de menú para usuario: ${usuario_id}`);

    try {
        // 👇 ACÁ ESTABA EL ERROR: Saqué ", stock" de la lista
        const result = await client.execute({
            sql: "SELECT id, nombre, precio, categoria, imagen, descripcion, tamanos FROM productos WHERE usuario_id = ?",
            args: [usuario_id]
        });

        console.log(`✅ Menú enviado: ${result.rows.length} productos.`);
        res.json(result.rows);

    } catch (error) {
        console.error("❌ ERROR FATAL EN MENÚ:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/public/pedidos
router.post('/pedidos', async (req, res) => {
    const { cliente, productos, total, metodoPago, usuario_id, mesa } = req.body;

    console.log("📡 Recibiendo pedido público:", cliente);

    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: "El pedido está vacío" });
    }

    try {
        const id = crypto.randomUUID();

        const resNum = await client.execute({
            sql: "SELECT MAX(numero_pedido) as maximo FROM pedidos WHERE usuario_id = ?",
            args: [usuario_id]
        });
        const nuevoNumero = (resNum.rows[0]?.maximo || 0) + 1;

        const clienteFinal = mesa ? `${cliente} (Mesa ${mesa})` : `${cliente} (Web)`;

        await client.execute({
            sql: `INSERT INTO pedidos (id, usuario_id, numero_pedido, cliente, productos, total, estado, metodoPago, fecha) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                usuario_id,
                nuevoNumero,
                clienteFinal,
                JSON.stringify(productos),
                total,
                'pendiente',
                metodoPago || 'Efectivo/QR',
                new Date().toISOString()
            ]
        });

        console.log(`✅ Pedido #${nuevoNumero} guardado.`);
        res.json({ message: "Pedido enviado", id, numero: nuevoNumero });

    } catch (error) {
        console.error("❌ ERROR FATAL EN PEDIDO:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
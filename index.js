import express from 'express';
import cors from 'cors';
import { client } from './db.js';
import crypto from 'crypto';

const app = express();

const allowedOrigins = [
    'http://localhost:5173', // Para cuando desarrollás en tu PC
    process.env.FRONTEND_URL  // La URL de Vercel que pondrás en Koyeb
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o apps móviles)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 8080;

// --- FINANZAS ---
app.get('/api/finanzas', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/finanzas', async (req, res) => {
    const { id, fecha, descripcion, monto, tipo } = req.body;
    try {
        await client.execute({
            sql: "INSERT INTO finanzas VALUES (?, ?, ?, ?, ?)",
            args: [id, fecha, descripcion, monto, tipo]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/finanzas/:id', async (req, res) => {
    try {
        await client.execute({ sql: "DELETE FROM finanzas WHERE id = ?", args: [req.params.id] });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PEDIDOS (COCINA) ---
app.get('/api/pedidos', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM pedidos ORDER BY fecha ASC");
        const pedidos = rs.rows.map(p => ({ ...p, items: JSON.parse(p.items) }));
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pedidos', async (req, res) => {
    const { id, numeroPedido, cliente, items, total, estado, fecha } = req.body;
    try {
        await client.execute({
            sql: "INSERT INTO pedidos VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, numeroPedido, cliente, JSON.stringify(items), total, estado, fecha]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        await client.execute({ sql: "DELETE FROM pedidos WHERE id = ?", args: [req.params.id] });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CIERRE DE CAJA ---
app.post('/api/cierre-caja', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();
    try {
        // 1. Guardar el historial de cierre
        await client.execute({
            sql: "INSERT INTO cierres VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, totalVentas, cantidadPedidos]
        });

        // 2. Crear ingreso automático en finanzas
        await client.execute({
            sql: "INSERT INTO finanzas VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `Cierre de Caja: ${cantidadPedidos} pedidos`, totalVentas, 'ingreso']
        });

        // 3. Limpiar los pedidos de la cocina (porque ya se cobraron y cerraron)
        await client.execute("DELETE FROM pedidos");

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍔 Servidor CoCo's Burger en puerto ${PORT}`);
});
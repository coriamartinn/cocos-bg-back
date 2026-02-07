import express from 'express';
import cors from 'cors';
import { client } from './db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Cargar variables de entorno (.env en local, Variables en Koyeb)
dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD (CORS) ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://tu-app-en-vercel.vercel.app' // 👈 REEMPLAZÁ CON TU URL REAL DE VERCEL
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (como Postman o el propio servidor)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`❌ Bloqueado por CORS: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Puerto dinámico para Koyeb
const PORT = process.env.PORT || 8000;

// Middleware simple para loguear peticiones (útil para debug en Koyeb)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// --- RUTAS DE FINANZAS ---
app.get('/api/finanzas', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
        console.error("Error en GET /finanzas:", error);
        res.status(500).json({ error: "Error al obtener finanzas" });
    }
});

app.post('/api/finanzas', async (req, res) => {
    const { id, fecha, descripcion, monto, tipo } = req.body;
    try {
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [id || crypto.randomUUID(), fecha, descripcion, monto, tipo]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Error en POST /finanzas:", error);
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

// --- RUTAS DE PEDIDOS (COCINA) ---
app.get('/api/pedidos', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM pedidos ORDER BY fecha ASC");
        // Mapeamos para que el frontend reciba los items como objeto/array y no como string
        const pedidos = rs.rows.map(p => ({
            ...p,
            items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items
        }));
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
});

app.post('/api/pedidos', async (req, res) => {
    const { id, numeroPedido, cliente, items, total, estado, fecha } = req.body;
    try {
        await client.execute({
            sql: "INSERT INTO pedidos (id, numeroPedido, cliente, items, total, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, numeroPedido, cliente, JSON.stringify(items), total, estado, fecha]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CIERRE DE CAJA (TRANSACCIÓN) ---
app.post('/api/cierre-caja', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        // Ejecutamos varias operaciones. 
        // 1. Guardar Cierre
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, totalVentas, cantidadPedidos]
        });

        // 2. Registrar el ingreso en Finanzas
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidadPedidos} pedidos`, totalVentas, 'ingreso']
        });

        // 3. Limpiar tabla de pedidos (Vaciado de cocina)
        await client.execute("DELETE FROM pedidos");

        res.json({ success: true, message: "Cierre completado y cocina vaciada" });
    } catch (error) {
        console.error("Error en Cierre de Caja:", error);
        res.status(500).json({ error: "Fallo en el proceso de cierre" });
    }
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ██████╗ ██████╗  ██████╗ ██████╗ ███████╗
    ██╔════╝██╔═══██╗██╔════╝██╔═══██╗██╔════╝
    ██║     ██║   ██║██║     ██║   ██║███████╗
    ██║     ██║   ██║██║     ██║   ██║╚════██║
    ╚██████╗╚██████╔╝╚██████╗╚██████╔╝███████║
     ╚═════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝
    🍔 Servidor CoCo's Burger listo en puerto ${PORT}
    🚀 Conectado a Turso DB
    `);
});
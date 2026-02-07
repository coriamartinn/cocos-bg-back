import express from 'express';
import cors from 'cors';
import { client } from './db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';

dotenv.config();
const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'https://cocos.coriadev.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
const PORT = process.env.PORT || 8000;

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Finanzas - Obtener histórico
app.get('/api/finanzas', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener finanzas" });
    }
});

// Cierre de Caja - CORREGIDO
app.post('/api/cierre-caja', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 1. Registrar el cierre
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad]
        });

        // 2. Insertar en finanzas como ingreso
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidad} pedidos`, total, 'ingreso']
        });

        // 3. Limpiar pedidos actuales
        await client.execute("DELETE FROM pedidos");

        res.json({ success: true, message: "Cierre completado" });
    } catch (error) {
        console.error("Error en cierre:", error);
        res.status(500).json({ error: "Fallo en el proceso de cierre", detalle: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍔 Servidor CoCo's Burger listo en puerto ${PORT}`);
});
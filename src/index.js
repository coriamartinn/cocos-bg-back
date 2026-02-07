import express from 'express';
import cors from 'cors';
import { client } from './src/db.js'; // Ajustado a tu estructura de carpetas
import crypto from 'crypto';
import dotenv from 'dotenv';

// Importamos las nuevas rutas (aseguráte de que los archivos existan)
import productosRoutes from './src/routes/productos.routes.js';
// Importaremos pedidos desde el archivo de rutas para limpiar el index
// Pero por ahora, mantengo tu lógica de pedidos aquí y la mejoro
import pedidosRoutes from './src/routes/pedidos.routes.js';

dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://cocos.coriadev.com',
    'https://cocos-burger.vercel.app' // Añadí esta por las dudas si usas la default de Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 8000;

// Middleware de Logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// --- RUTAS DE PRODUCTOS (NUEVO) ---
// Esta es la ruta que tu PantallaPOS está buscando para llenar la grilla
app.use('/api/productos', productosRoutes);

// --- RUTAS DE PEDIDOS (NUEVO/ACTUALIZADO) ---
// Usamos el router de pedidos para manejar el POST y GET de cocina
app.use('/api/pedidos', pedidosRoutes);

// --- RUTAS DE FINANZAS ---
app.get('/api/finanzas', async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM finanzas ORDER BY fecha DESC");
        res.json(rs.rows);
    } catch (error) {
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
        res.status(500).json({ error: error.message });
    }
});

// --- CIERRE DE CAJA ---
app.post('/api/cierre-caja', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();
    try {
        // Transacción manual simple
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, totalVentas, cantidadPedidos]
        });
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidadPedidos} pedidos`, totalVentas, 'ingreso']
        });
        await client.execute("DELETE FROM pedidos");
        res.json({ success: true, message: "Cierre completado" });
    } catch (error) {
        res.status(500).json({ error: "Fallo en el proceso de cierre" });
    }
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ██████╗ ██████╗  ██████╗ ██████╗ ███████╗
    ██╔════╝██╔═══██╗██╔════╝██╔═══██╗██╔════╝
    ██║     ██║   ██║██║     ██║   ██║███████╗
    ██║     ██║   ██║██║     ██║   ██║╚════██║
    ╚██████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║
     ╚═════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝
    🍔 Servidor CoCo's Burger listo en puerto ${PORT}
    🚀 Conectado a Turso DB
    `);
});
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto'; // <--- AGREGADO
import { client } from './db.js'; // <--- AGREGADO (Asegurate que la ruta sea correcta)

import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';

// Configuración de variables de entorno
dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE CORS ---
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

// --- MIDDLEWARES ---
app.use(express.json());

// --- CENTRAL DE RUTAS (Modulares) ---
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/auth', usuariosRoutes);

// --- RUTA DE CIERRE DE DÍA (Directa) ---
app.post('/api/cierre-caja', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 1. Guardar el histórico en la tabla 'cierres'
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad]
        });

        // 2. Registrar el ingreso automáticamente en la tabla 'finanzas'
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE DE CAJA: ${cantidad} pedidos`, total, 'ingreso']
        });

        // 3. Limpiar la mesa de pedidos activos
        await client.execute("DELETE FROM pedidos");

        // 4. Resetear el autoincremental
        try {
            await client.execute("DELETE FROM sqlite_sequence WHERE name='pedidos'");
        } catch (seqError) {
            console.log("Aviso: No se pudo resetear la secuencia.");
        }

        res.json({
            success: true,
            message: "Cierre completado con éxito."
        });

    } catch (error) {
        console.error("Error crítico en el proceso de cierre:", error);
        res.status(500).json({
            error: "Fallo en el servidor al procesar el cierre",
            details: error.message
        });
    }
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`==========================================`);
    console.log(`🍔 CoCo's Burger API - CoriaTech Studio`);
    console.log(`🚀 Servidor listo en: http://0.0.0.0:${PORT}`);
    console.log(`==========================================`);
});
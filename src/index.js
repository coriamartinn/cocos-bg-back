import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';

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
        // Permitir peticiones sin origen (como Postman o apps móviles) o de orígenes permitidos
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
// Cada una cuelga de su propio prefijo /api/...
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/finanzas', finanzasRoutes);

// --- MANEJO DE ERRORES GLOBAL (Opcional pero recomendado) ---
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
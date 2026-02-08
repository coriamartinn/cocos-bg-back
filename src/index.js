import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from "@libsql/client"; // Asegurate de importar createClient si usas Turso directo acá
import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';

// Configuración de variables de entorno
dotenv.config();

// Cliente de BD para el index (si no lo importás de un archivo db.js compartido)
const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const app = express();

// --- CONFIGURACIÓN DE CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://cocos.coriadev.com' // Tu dominio real
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
// Aquí es donde está la lógica de hasheo (en usuariosRoutes)
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/auth', usuariosRoutes);

// --- RUTA DE CIERRE DE DÍA (SaaS) ---
app.post('/api/cierre-caja', async (req, res) => {
    // 1. OBTENER EL ID DEL USUARIO (Vital para SaaS)
    const usuarioId = req.headers['x-user-id'];
    const { totalVentas, cantidadPedidos, pedidosIds } = req.body;

    if (!usuarioId) {
        return res.status(400).json({ error: "Falta identificación de usuario para cerrar caja" });
    }

    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 2. Guardar el histórico ASIGNADO AL USUARIO
        // (Asegurate de haber creado la tabla 'cierres' con la columna usuario_id si la usas,
        //  sino podés saltar este paso o crear la tabla primero)
        /* await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos, usuario_id) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad, usuarioId]
        });
        */

        // 3. Registrar el ingreso en FINANZAS (Asignado al usuario)
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo, usuario_id) VALUES (?, ?, ?, ?, ?, ?)",
            args: [
                crypto.randomUUID(),
                fecha,
                `CIERRE DE CAJA: ${cantidad} pedidos`,
                total,
                'ingreso',
                usuarioId // <--- IMPORTANTE
            ]
        });

        // 4. Limpiar pedidos SOLO DE ESTE USUARIO
        // (No borramos los de otros clientes)
        await client.execute({
            sql: "DELETE FROM pedidos WHERE usuario_id = ?",
            args: [usuarioId]
        });

        // 5. OJO CON EL RESET DE AUTOINCREMENTAL:
        // En un sistema SaaS compartido, NO debés resetear el sqlite_sequence de la tabla pedidos,
        // porque afectaría a los IDs de los otros usuarios. 
        // Es mejor dejar que los IDs sigan creciendo o usar UUIDs como ya venís haciendo.
        // (He eliminado esa parte para seguridad del sistema).

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
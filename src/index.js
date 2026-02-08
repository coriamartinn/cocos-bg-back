import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto'; // IMPORTANTE
import { client } from './db.js'; // IMPORTANTE
import productosRoutes from './routes/productos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';

dotenv.config();
const app = express();

// ... Configuración de CORS igual que antes ...

app.use(express.json());

// Rutas Modulares
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/finanzas', finanzasRoutes);

// --- RUTA DE CIERRE DE DÍA (Directa) ---
app.post('/api/cierre', async (req, res) => {
    const { totalVentas, cantidadPedidos } = req.body;
    const fecha = new Date().toISOString();

    try {
        const total = Number(totalVentas) || 0;
        const cantidad = Number(cantidadPedidos) || 0;

        // 1. Histórico
        await client.execute({
            sql: "INSERT INTO cierres (id, fecha, totalVentas, cantidadPedidos) VALUES (?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, total, cantidad]
        });

        // 2. Impacto en Finanzas
        await client.execute({
            sql: "INSERT INTO finanzas (id, fecha, descripcion, monto, tipo) VALUES (?, ?, ?, ?, ?)",
            args: [crypto.randomUUID(), fecha, `CIERRE: ${cantidad} pedidos`, total, 'ingreso']
        });

        // 3. Limpieza
        await client.execute("DELETE FROM pedidos");
        await client.execute("DELETE FROM sqlite_sequence WHERE name='pedidos'");

        res.json({ success: true, message: "Cierre completado." });
    } catch (error) {
        console.error("Error en cierre:", error);
        res.status(500).json({ error: "Fallo en el cierre" });
    }
});

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
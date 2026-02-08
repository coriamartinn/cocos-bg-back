import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "libsql://tu-url.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN || "tu-token"
});

const migrarTablas = async () => {
    console.log("🏗️  Adaptando base de datos para Multi-Usuario...");

    try {
        // Agregamos la columna usuario_id a PRODUCTOS
        await db.execute("ALTER TABLE productos ADD COLUMN usuario_id TEXT");
        console.log("✅ Tabla 'productos' actualizada.");
    } catch (e) { console.log("⚠️  'productos' ya tenía la columna o error:", e.message); }

    try {
        // Agregamos la columna usuario_id a PEDIDOS
        await db.execute("ALTER TABLE pedidos ADD COLUMN usuario_id TEXT");
        console.log("✅ Tabla 'pedidos' actualizada.");
    } catch (e) { console.log("⚠️  'pedidos' ya tenía la columna o error:", e.message); }

    try {
        // Agregamos la columna usuario_id a FINANZAS
        await db.execute("ALTER TABLE finanzas ADD COLUMN usuario_id TEXT");
        console.log("✅ Tabla 'finanzas' actualizada.");
    } catch (e) { console.log("⚠️  'finanzas' ya tenía la columna o error:", e.message); }

    // (Si tenés tabla de cierres o estadisticas, agregalo acá también)

    console.log("🚀 Base de datos lista para SaaS.");
};

migrarTablas();
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const blindar = async () => {
    console.log("🛡️ Blindando la base de datos...");
    try {
        // 1. Borramos pedidos para arrancar limpio y sin errores de duplicados viejos
        await db.execute("DELETE FROM pedidos");
        console.log("✅ Pedidos limpios.");

        // 2. Creamos un INDICE ÚNICO
        // Esto hace IMPOSIBLE tener dos pedidos con el mismo número
        await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_unico 
      ON pedidos(usuario_id, numero_pedido);
    `);
        console.log("🔒 Candado aplicado. No más duplicados.");

    } catch (error) {
        console.error("Error:", error);
    }
};

blindar();
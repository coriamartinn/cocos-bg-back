import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const migrar = async () => {
    try {
        // Agregamos la columna si no existe
        await db.execute("ALTER TABLE pedidos ADD COLUMN numero_pedido INTEGER");
        console.log("✅ Columna numero_pedido agregada.");
    } catch (e) {
        console.log("ℹ️ La columna ya existía, seguimos.");
    }

    console.log("🚀 Listo para la lógica inteligente.");
};

migrar();
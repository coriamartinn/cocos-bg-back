import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Cargar variables de entorno (.env)
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const rearmarTabla = async () => {
  console.log("🚧 INICIANDO RECONSTRUCCIÓN DE TABLA 'PEDIDOS'...");

  try {
    // 1. Borrar la tabla vieja si existe
    console.log("💣 Eliminando tabla antigua...");
    await db.execute("DROP TABLE IF EXISTS pedidos");

    // 2. Crear la tabla nueva BLINDADA
    console.log("🏗️  Creando tabla nueva con PRIMARY KEY...");

    await db.execute(`
      CREATE TABLE pedidos (
        id TEXT PRIMARY KEY NOT NULL,  -- <--- AGREGADO "NOT NULL". SI INTENTA ENTRAR NULL, REBOTA.
        numero_pedido INTEGER,
        usuario_id TEXT NOT NULL,
        cliente TEXT,
        productos TEXT,
        total REAL,
        estado TEXT DEFAULT 'pendiente',
        metodoPago TEXT,
        fecha TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notas TEXT
      );
    `);

    // 3. Crear índice para que las búsquedas sean rápidas
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_usuario_id ON pedidos(usuario_id);
    `);

    console.log("\n✅ ¡ÉXITO! La tabla 'pedidos' fue rearmada correctamente.");
    console.log("🛡️  Ahora la columna 'id' es PRIMARY KEY. Los duplicados son imposibles.");

  } catch (error) {
    console.error("\n❌ ERROR AL REARMAR:", error);
  }
};

rearmarTabla();
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import bcrypt from "bcrypt"; // Asegurate de tener esto instalado (npm install bcrypt)

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const crearUsuario = async () => {
  const email = "test@cocos.com";
  const passPlana = "1234"; // Tu contraseña fácil
  
  console.log("🔐 Encriptando contraseña...");
  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash(passPlana, salt);
  
  const id = crypto.randomUUID();

  try {
    // Intentamos insertar SIN la columna 'nombre' que dio error antes
    await db.execute({
      sql: `INSERT INTO usuarios (id, email, password, nombre_local) 
            VALUES (?, ?, ?, ?)`,
      args: [id, email, passHash, 'CoCos Local']
    });
    console.log(`✅ ¡Usuario Creado con Éxito!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Pass: ${passPlana}`);
  } catch (e) {
    console.error("❌ Error al crear usuario:", e);
  }
};

crearUsuario();
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Carga las variables de entorno (URL y TOKEN de tu BD)
dotenv.config();

// 1. Configuración de la conexión
// Si no usas .env, podés pegar las credenciales 'hardcodeadas' acá temporalmente para correr el script
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "libsql://cocos-burger-coriamartinn.aws-us-east-1.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzA0ODM5MzUsImlkIjoiYjFiM2JlYWItZTJhOC00YTQyLWI1YTgtMWMwMTYxMTNiNDIzIiwicmlkIjoiYjAzZTc3NjYtOGI4MC00OTM4LWE4ZGEtMDc5MjNhODY3NTAwIn0.5_1EJ8uiKgnQwq5FM0cj7fdVhmOHfsVbAnYHfkiWZTm2Bp_NmDiGqZsz7WmGUCBYX-WHfaLwCMHsAVYgfNAUCA"
});

const inicializarBaseDeDatos = async () => {
    console.log("🚀 Iniciando configuración de Licencias (Pago Único)...");

    try {
        // 2. Crear tabla de Usuarios (Clientes SaaS)
        // comprado: 1 = SÍ (Acceso total), 0 = NO (Bloqueado/Demo)
        await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre_local TEXT NOT NULL,
        comprado INTEGER DEFAULT 0, 
        fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log("✅ Tabla 'usuarios' creada correctamente.");

        // 3. Crear Usuario ADMIN (Vos, Martín - Acceso Total)
        // Nota: En el sistema real, la password debe guardarse encriptada (Hash). 
        // Acá ponemos texto plano solo para probar el login inicial.
        await db.execute({
            sql: `INSERT OR IGNORE INTO usuarios (id, email, password, nombre_local, comprado) 
            VALUES (?, ?, ?, ?, ?)`,
            args: [
                crypto.randomUUID(),
                'admin@coriatech.com',
                'admin123',       // Password temporal
                'CoriaTech Admin',
                1                 // 1 = COMPRADO (Dueño)
            ]
        });
        console.log("👤 Usuario Admin creado (Comprado = 1)");

        // 4. Crear Usuario CLIENTE BLOQUEADO (Para probar la pantalla de bloqueo)
        await db.execute({
            sql: `INSERT OR IGNORE INTO usuarios (id, email, password, nombre_local, comprado) 
            VALUES (?, ?, ?, ?, ?)`,
            args: [
                crypto.randomUUID(),
                'cliente@prueba.com',
                'cliente123',
                'Local de Prueba',
                0                 // 0 = NO COMPRADO
            ]
        });
        console.log("🔒 Usuario Cliente creado (Comprado = 0)");

    } catch (error) {
        console.error("❌ Error en la base de datos:", error);
    }
};

inicializarBaseDeDatos();
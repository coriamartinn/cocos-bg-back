import { createClient } from "@libsql/client";
import bcrypt from 'bcryptjs';
import dotenv from "dotenv";

// Cargar variables de entorno (.env)
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const migrarPasswords = async () => {
    console.log("🔒 Iniciando proceso de encriptación de contraseñas...");

    try {
        // 1. Traemos TODOS los usuarios
        const res = await db.execute("SELECT * FROM usuarios");
        const usuarios = res.rows;

        if (usuarios.length === 0) {
            console.log("⚠️ No hay usuarios en la base de datos.");
            return;
        }

        let actualizados = 0;

        // 2. Recorremos uno por uno
        for (const u of usuarios) {
            const passwordActual = u.password;

            // 3. Chequeamos si YA está encriptada
            // Las contraseñas de bcrypt siempre empiezan con "$2a$" o "$2b$"
            if (passwordActual.startsWith('$2')) {
                console.log(`✅ El usuario ${u.email} ya tiene la contraseña segura. Saltando...`);
                continue;
            }

            console.log(`⚠️  Encriptando contraseña de: ${u.email}...`);

            // 4. Encriptamos (Hasheamos)
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(passwordActual, salt);

            // 5. Guardamos el cambio en la BD
            await db.execute({
                sql: "UPDATE usuarios SET password = ? WHERE id = ?",
                args: [hash, u.id]
            });

            actualizados++;
            console.log(`✨ ¡Listo! ${u.email} actualizado.`);
        }

        console.log(`\n🎉 Proceso terminado. Se encriptaron ${actualizados} usuarios.`);

    } catch (error) {
        console.error("❌ Error grave:", error);
    }
};

migrarPasswords();
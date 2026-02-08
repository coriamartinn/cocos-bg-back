import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "libsql://cocos-burger-coriamartinn.aws-us-east-1.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzA0ODM5MzUsImlkIjoiYjFiM2JlYWItZTJhOC00YTQyLWI1YTgtMWMwMTYxMTNiNDIzIiwicmlkIjoiYjAzZTc3NjYtOGI4MC00OTM4LWE4ZGEtMDc5MjNhODY3NTAwIn0.5_1EJ8uiKgnQwq5FM0cj7fdVhmOHfsVbAnYHfkiWZTm2Bp_NmDiGqZsz7WmGUCBYX-WHfaLwCMHsAVYgfNAUCA"
});

// CAMBIÁ ESTO POR EL EMAIL AL QUE LE QUERÉS ASIGNAR TODO
const EMAIL_DUEÑO = 'cocosbrg@gmail.com';

const asignarDueño = async () => {
    console.log(`🕵️ Buscando usuario: ${EMAIL_DUEÑO}...`);

    try {
        // 1. Buscamos el ID del usuario dueño
        const userRes = await db.execute({
            sql: "SELECT id FROM usuarios WHERE email = ?",
            args: [EMAIL_DUEÑO]
        });

        if (userRes.rows.length === 0) {
            console.error("❌ No encontré ese usuario. Registralo primero o corre el script de usuarios.");
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`✅ Usuario encontrado. ID: ${userId}`);
        console.log("📦 Asignando datos huérfanos...");

        // 2. Actualizamos PRODUCTOS
        const prodRes = await db.execute({
            sql: "UPDATE productos SET usuario_id = ? WHERE usuario_id IS NULL",
            args: [userId]
        });
        console.log(`🍔 Productos recuperados: ${prodRes.rowsAffected}`);

        // 3. Actualizamos PEDIDOS
        const pedRes = await db.execute({
            sql: "UPDATE pedidos SET usuario_id = ? WHERE usuario_id IS NULL",
            args: [userId]
        });
        console.log(`📝 Pedidos recuperados: ${pedRes.rowsAffected}`);

        // 4. Actualizamos FINANZAS
        const finRes = await db.execute({
            sql: "UPDATE finanzas SET usuario_id = ? WHERE usuario_id IS NULL",
            args: [userId]
        });
        console.log(`💰 Movimientos recuperados: ${finRes.rowsAffected}`);

        console.log("\n🎉 ¡Listo! Ahora cuando entres con ese usuario, verás toda tu data.");

    } catch (error) {
        console.error("❌ Error en la migración:", error);
    }
};

asignarDueño();
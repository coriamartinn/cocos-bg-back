import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

const limpiezaTotal = async () => {
    console.log("🔥 INICIANDO LIMPIEZA DE VENTAS Y CAJA...");

    try {
        // 1. Borrar Pedidos
        await db.execute("DELETE FROM pedidos");
        console.log("✅ Tabla 'pedidos' vaciada.");

        // 2. Borrar Finanzas (Caja)
        await db.execute("DELETE FROM finanzas");
        console.log("✅ Tabla 'finanzas' vaciada.");

        // 3. (Opcional) Borrar Cierres de caja si tenés esa tabla
        try {
            await db.execute("DELETE FROM cierres");
            console.log("✅ Tabla 'cierres' vaciada.");
        } catch (e) { }

        // 4. RESETEAR CONTADORES AUTOINCREMENTALES (Vital para que vuelva al ID 1)
        try {
            await db.execute("DELETE FROM sqlite_sequence WHERE name='pedidos'");
            await db.execute("DELETE FROM sqlite_sequence WHERE name='finanzas'");
            console.log("🔄 Contadores reiniciados a 0.");
        } catch (e) {
            console.log("⚠️ No se pudieron reiniciar secuencias (quizás no usas autoincrement).");
        }

        console.log("\n✨ ¡LISTO! El sistema está como nuevo (pero con tus productos y usuarios intactos).");

    } catch (error) {
        console.error("❌ Error al limpiar:", error);
    }
};

limpiezaTotal();
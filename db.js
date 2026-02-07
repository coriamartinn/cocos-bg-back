import { createClient } from '@libsql/client';

// En producción (Koyeb), las variables ya están en process.env
// No necesitamos llamar a dotenv.config() aquí si ya están en el sistema
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("--- ESTADO DE CONEXIÓN ---");
console.log("Buscando URL:", "TURSO_DATABASE_URL");
console.log("Resultado:", url ? "✅ RECIBIDA" : "❌ NO ENCONTRADA");

if (!url) {
    console.error("CRÍTICO: No se puede conectar a la DB porque la URL es undefined.");
}

export const client = createClient({
    url: url || "",
    authToken: authToken || "",
});
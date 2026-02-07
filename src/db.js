import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Solo cargamos dotenv si no estamos en producción
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("--- ESTADO DE CONEXIÓN ---");
console.log("URL de la DB:", url ? "✅ RECIBIDA" : "❌ NO ENCONTRADA");

if (!url) {
    console.error("CRÍTICO: La URL es undefined. Verificá tu archivo .env");
}

export const client = createClient({
    url: url || "",
    authToken: authToken || "",
});

export default client; // Agregamos export default para que sea más fácil de importar
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Usamos los nombres EXACTOS de tu archivo .env
const url = process.env.TURSO_DATABASE_URL; // Antes decía TURSO_URL
const authToken = process.env.TURSO_AUTH_TOKEN; // Antes decía TURSO_TOKEN

console.log("--- CHEQUEO DE VARIABLES ---");
console.log("URL de Turso:", url ? "RECIBIDA ✅" : "VIENE VACÍA ❌");

export const client = createClient({
    url: url || "",
    authToken: authToken || "",
});
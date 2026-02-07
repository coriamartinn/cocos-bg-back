import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Forzamos la carga de variables
dotenv.config();

// Creamos constantes locales para debuguear
const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

// LOGS DE EMERGENCIA: Esto aparecerá en la consola de Koyeb
console.log("--- CHEQUEO DE VARIABLES ---");
console.log("URL de Turso:", url ? "RECIBIDA ✅" : "VIENE VACÍA (undefined) ❌");

// Si la URL falla, le damos un string vacío para que no explote el proceso entero 
// y nos deje ver los logs con calma
export const client = createClient({
    url: url || "libsql://cocos-burger-coriamartinn.aws-us-east-1.turso.io",
    authToken: authToken || "",
});
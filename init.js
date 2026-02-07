// init.js
import { client } from './db.js';

async function setupDatabase() {
    console.log("🚀 Iniciando configuración de la base de datos en Turso...");

    try {
        // 1. Tabla de Finanzas (Gastos e Ingresos manuales)
        await client.execute(`
      CREATE TABLE IF NOT EXISTS finanzas (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        tipo TEXT NOT NULL
      )
    `);
        console.log("✅ Tabla 'finanzas' lista.");

        // 2. Tabla de Pedidos (Para la cocina y el POS)
        // Guardamos 'items' como TEXT porque SQLite no tiene tipo Array (usaremos JSON.stringify)
        await client.execute(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY,
        numeroPedido INTEGER,
        cliente TEXT,
        items TEXT, 
        total REAL,
        estado TEXT, 
        fecha TEXT
      )
    `);
        console.log("✅ Tabla 'pedidos' lista.");

        // 3. Tabla de Cierres de Caja (Historial de ventas por día)
        await client.execute(`
      CREATE TABLE IF NOT EXISTS cierres (
        id TEXT PRIMARY KEY,
        fechaCierre TEXT NOT NULL,
        totalVentas REAL NOT NULL,
        cantidadPedidos INTEGER NOT NULL
      )
    `);
        console.log("✅ Tabla 'cierres' lista.");

        console.log("\n✨ ¡Estructura completa! Ya podés correr el backend con pnpm run dev.");
    } catch (error) {
        console.error("❌ Error al crear las tablas:", error);
    }
}

setupDatabase();
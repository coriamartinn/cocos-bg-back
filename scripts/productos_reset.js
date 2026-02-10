import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// 🍔 TUS PRODUCTOS REALES (Copiados de las fotos)
// Nota: Unifiqué la categoría a "BURGER" para que el frontend las detecte bien.
const misProductos = [
  // --- BURGERS JUNIOR ---
  {
    nombre: "Cheese Burger JR",
    categoria: "BURGER",
    precio: 6000,
    imagen: "🍔",
    descripcion: "Medallón de 80g con cheddar.",
    tamanos: JSON.stringify({ simple: 6000, doble: 7500 })
  },
  {
    nombre: "Cuarto de Libra JR",
    categoria: "BURGER",
    precio: 6500,
    imagen: "🍔",
    descripcion: "Medallón de 80g con cebolla, ketchup y mostaza.",
    tamanos: JSON.stringify({ simple: 6500, doble: 8000 })
  },
  {
    nombre: "Clasica JR",
    categoria: "BURGER",
    precio: 6500,
    imagen: "🍔",
    descripcion: "Medallón de 80g con lechuga y tomate.",
    tamanos: JSON.stringify({ simple: 6500, doble: 8000 })
  },
  {
    nombre: "Veggie COCOS",
    categoria: "BURGER",
    precio: 7500,
    imagen: "🥗",
    descripcion: "Medallón Veggie. Incluye lechuga y tomate.",
    tamanos: JSON.stringify({ simple: 7500, doble: 9000 })
  },

  // --- BURGERS MAX ---
  {
    nombre: "Cheese Burger MAX",
    categoria: "BURGER",
    precio: 8000,
    imagen: "🍔",
    descripcion: "Medallón de 125g con extra cheddar.",
    tamanos: JSON.stringify({ simple: 8000, doble: 10000 })
  },
  {
    nombre: "Cuarto de Libra MAX",
    categoria: "BURGER",
    precio: 8500,
    imagen: "🍔",
    descripcion: "125g de carne, cebolla, ketchup y mostaza.",
    tamanos: JSON.stringify({ simple: 8500, doble: 10500 })
  },
  {
    nombre: "Clasica MAX",
    categoria: "BURGER",
    precio: 8500,
    imagen: "🍔",
    descripcion: "A la parrilla con lechuga y tomate (125g).",
    tamanos: JSON.stringify({ simple: 8500, doble: 10500 })
  },
  {
    nombre: "Cuarto Me Triple",
    categoria: "BURGER",
    precio: 13500,
    imagen: "🧨",
    descripcion: "La bestia. Triple carne, triple queso.",
    tamanos: JSON.stringify({ simple: 13500 })
  },

  // --- PROMOS ---
  {
    nombre: "Cheese Burger PROMO",
    categoria: "promos",
    precio: 10000,
    imagen: "🎉",
    descripcion: "Promo 2 hamburguesas Cheese JR.",
    tamanos: JSON.stringify({ simple: 10000 })
  },
  {
    nombre: "Veggies COCOS PROMO",
    categoria: "promos",
    precio: 12500,
    imagen: "🎉",
    descripcion: "Promo 2 hamburguesas Veggies.",
    tamanos: JSON.stringify({ simple: 12500 })
  },
  {
    nombre: "Clasica COCOS PROMO",
    categoria: "promos",
    precio: 20000,
    imagen: "🎉",
    descripcion: "Promo 2 hamburguesas Clasica MAX.",
    tamanos: JSON.stringify({ simple: 20000 })
  },
  {
    nombre: "Cuarto COCOS PROMO",
    categoria: "promos",
    precio: 20000,
    imagen: "🎉",
    descripcion: "Promo 2 Cuarto de Libra MAX.",
    tamanos: JSON.stringify({ simple: 20000 })
  },

  // --- ACOMPAÑAMIENTOS ---
  {
    nombre: "Papas Extras (300gr)",
    categoria: "acompañamiento",
    precio: 5000,
    imagen: "🍟",
    descripcion: "Porción de papas fritas crocantes.",
    tamanos: JSON.stringify({ simple: 5000 })
  }
];

const cargarMenuReal = async () => {
  console.log("🚀 Iniciando carga del MENÚ REAL para TODOS los usuarios...");

  try {
    // 1. Buscamos todos los usuarios
    const usuariosResult = await db.execute("SELECT id, email FROM usuarios");
    const usuarios = usuariosResult.rows;

    if (usuarios.length === 0) {
      console.log("⚠️ No hay usuarios creados. Creá uno primero.");
      return;
    }

    for (const user of usuarios) {
      console.log(`\n🔄 Actualizando menú de: ${user.email}...`);

      // 2. Borramos menú viejo
      await db.execute({
        sql: "DELETE FROM productos WHERE usuario_id = ?",
        args: [user.id]
      });

      // 3. Insertamos menú nuevo
      for (const p of misProductos) {
        const id = randomUUID();
        await db.execute({
          sql: `INSERT INTO productos (id, usuario_id, nombre, categoria, precio, imagen, descripcion, tamanos) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, user.id, p.nombre, p.categoria, p.precio, p.imagen, p.descripcion, p.tamanos]
        });
        process.stdout.write(".");
      }
      console.log(" ✅ OK");
    }

    console.log("\n\n✨ ¡LISTO! Menú actualizado y unificado.");
    console.log("👉 Probá entrar con 'test@cocos.com' y vas a ver tus productos reales.");

  } catch (e) {
    console.error("\n❌ Error:", e);
  }
};

cargarMenuReal();
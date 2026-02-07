import { client } from './db.js';

const PRODUCTOS = [
  // LÍNEA JUNIOR (80g)
  {
    id: 'jr1',
    nombre: 'Cheese Burger JR',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'Medallón de 80g con cheddar. Incluye papas fritas.',
    tamanos: { simple: 6000, doble: 10000 }
  },
  {
    id: 'jr3',
    nombre: 'Cuarto de libra JR',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'Medallón de 80g con cebolla caramelizada, cheddar y aderezos. Incluye papas fritas.',
    tamanos: { simple: 6500, doble: 12000 }
  },
  {
    id: 'jr4',
    nombre: 'Clasica JR',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'Medallón de 80g con lechuga, tomate y aderezos. Incluye papas fritas.',
    tamanos: { simple: 6500, doble: 12000 }
  },
  {
    id: 'jr5',
    nombre: 'Veggie COCOS',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'Medallón Veggie (2 versiones mezcla de hongos o lentejas). Incluye papas fritas.',
    tamanos: { simple: 7500, doble: 15000 }
  },
  // LÍNEA MAX (125g)
  {
    id: 'max1',
    nombre: 'Cheese Burger MAX',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'Medallón de 125g con extra cheddar. Incluye papas fritas.',
    tamanos: { simple: 8000, doble: 14000 }
  },
  {
    id: 'max3',
    nombre: 'Cuarto de Libra MAX',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: '125g de carne, cebolla, ketchup y mostaza. Incluye papas fritas.',
    tamanos: { simple: 8500, doble: 15500 }
  },
  {
    id: 'max4',
    nombre: 'Clasica MAX',
    categoria: 'hamburguesa',
    precio: 0,
    imagen: '🍔',
    descripcion: 'A la parrilla con lechuga, tomate y mayonesa. Incluye papas fritas.',
    tamanos: { simple: 8500, doble: 15500 }
  },
  // PROMOS
  {
    id: 'p1',
    nombre: 'Cheese burger PROMO',
    categoria: 'promos',
    precio: 10000,
    imagen: '🎉',
    descripcion: 'Promo 2 hamburguesas cheese burger con papas.'
  },
  {
    id: 'p2',
    nombre: 'Cuarto COCOS PROMO',
    categoria: 'promos',
    precio: 20000,
    imagen: '🎉',
    descripcion: 'Promo 2 hamburguesas cuarto de libra con papas.'
  },
  {
    id: 'p3',
    nombre: 'Clasica COCOS PROMO',
    categoria: 'promos',
    precio: 10000,
    imagen: '🎉',
    descripcion: 'Promo 2 hamburguesas clasicas con lechuga, tomate y aderezo + papas.'
  },
  {
    id: 'p4',
    nombre: 'Veggies COCOS PROMO',
    categoria: 'promos',
    precio: 12500,
    imagen: '🎉',
    descripcion: 'Promo 2 hamburguesas veggies + papas.'
  },
  // ACOMPAÑAMIENTOS
  {
    id: 's2',
    nombre: 'Papas con Cheddar',
    categoria: 'acompañamiento',
    precio: 6000,
    imagen: '🧀',
    descripcion: 'Porción extra bañada en salsa cheddar.'
  },
  {
    id: 's4',
    nombre: 'Papas CoCo\'s (Cheddar y Bacon)',
    categoria: 'acompañamiento',
    precio: 7500,
    imagen: '🥓',
    descripcion: 'Porción extra con cheddar, panceta crocante y verdeo.'
  },
  {
    id: 's3',
    nombre: 'Aros de Cebolla',
    categoria: 'acompañamiento',
    precio: 5000,
    imagen: '🧅'
  },
  // NUGGETS
  {
    id: 'n1',
    nombre: 'Nuggets (6 pzs)',
    categoria: 'nuggets',
    precio: 4800,
    imagen: '🍗'
  },
  {
    id: 'n2',
    nombre: 'Nuggets (12 pzs)',
    categoria: 'nuggets',
    precio: 8500,
    imagen: '🍗'
  },
  {
    id: 'n3',
    nombre: 'Nuggets (20 pzs)',
    categoria: 'nuggets',
    precio: 13500,
    imagen: '🍗'
  }
];

async function initDB() {
  try {
    console.log("🛠️ Creando tablas en Turso...");

    // Tabla de Productos
    await client.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL DEFAULT 0,
        imagen TEXT,
        descripcion TEXT,
        tamanos TEXT
      )
    `);

    // Tabla de Pedidos (Estructura base)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numeroPedido TEXT,
        cliente TEXT,
        items TEXT NOT NULL, -- Guardaremos el array de items como JSON string
        total REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        metodoPago TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("📥 Cargando productos al menú...");

    for (const p of PRODUCTOS) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO productos (id, nombre, categoria, precio, imagen, descripcion, tamanos) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id,
          p.nombre,
          p.categoria,
          p.precio || 0,
          p.imagen || '',
          p.descripcion || '',
          p.tamanos ? JSON.stringify(p.tamanos) : null
        ]
      });
    }

    console.log("✅ Proceso finalizado: Tablas creadas y menú cargado.");
  } catch (error) {
    console.error("❌ Error inicializando la base de datos:", error);
  }
}

initDB();
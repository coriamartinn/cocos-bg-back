import { client } from './db.js';

const PRODUCTOS = [
  // LÍNEA JUNIOR (80g)
  { id: 'jr1', nombre: 'Cheese Burger JR', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'Medallón de 80g con cheddar. Incluye papas fritas.', tamanos: { simple: 6000, doble: 10000 } },
  { id: 'jr3', nombre: 'Cuarto de libra JR', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'Medallón de 80g con cebolla caramelizada, cheddar y aderezos. Incluye papas fritas.', tamanos: { simple: 6500, doble: 12000 } },
  { id: 'jr4', nombre: 'Clasica JR', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'Medallón de 80g con lechuga, tomate y aderezos. Incluye papas fritas.', tamanos: { simple: 6500, doble: 12000 } },
  { id: 'jr5', nombre: 'Veggie COCOS', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'Medallón Veggie. Incluye papas fritas.', tamanos: { simple: 7500, doble: 15000 } },
  // LÍNEA MAX (125g)
  { id: 'max1', nombre: 'Cheese Burger MAX', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'Medallón de 125g con extra cheddar. Incluye papas fritas.', tamanos: { simple: 8000, doble: 14000 } },
  { id: 'max3', nombre: 'Cuarto de Libra MAX', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: '125g de carne, cebolla, ketchup y mostaza. Incluye papas fritas.', tamanos: { simple: 8500, doble: 15500 } },
  { id: 'max4', nombre: 'Clasica MAX', categoria: 'hamburguesa', precio: 0, imagen: '🍔', descripcion: 'A la parrilla con lechuga, tomate y mayonesa. Incluye papas fritas.', tamanos: { simple: 8500, doble: 15500 } },
  // PROMOS
  { id: 'p1', nombre: 'Cheese burger PROMO', categoria: 'promos', precio: 10000, imagen: '🎉', descripcion: 'Promo 2 hamburguesas cheese burger con papas.' },
  { id: 'p2', nombre: 'Cuarto COCOS PROMO', categoria: 'promos', precio: 20000, imagen: '🎉', descripcion: 'Promo 2 hamburguesas cuarto de libra con papas.' },
  { id: 'p3', nombre: 'Clasica COCOS PROMO', categoria: 'promos', precio: 10000, imagen: '🎉', descripcion: 'Promo 2 hamburguesas clasicas + papas.' },
  { id: 'p4', nombre: 'Veggies COCOS PROMO', categoria: 'promos', precio: 12500, imagen: '🎉', descripcion: 'Promo 2 hamburguesas veggies + papas.' },
  // ACOMPAÑAMIENTOS
  { id: 's2', nombre: 'Papas con Cheddar', categoria: 'acompañamiento', precio: 6000, imagen: '🧀', descripcion: 'Porción extra bañada en salsa cheddar.' },
  { id: 's4', nombre: 'Papas CoCo\'s', categoria: 'acompañamiento', precio: 7500, imagen: '🥓', descripcion: 'Porción extra con cheddar, panceta y verdeo.' },
  { id: 's3', nombre: 'Aros de Cebolla', categoria: 'acompañamiento', precio: 5000, imagen: '🧅' },
  // NUGGETS
  { id: 'n1', nombre: 'Nuggets (6 pzs)', categoria: 'nuggets', precio: 4800, imagen: '🍗' },
  { id: 'n2', nombre: 'Nuggets (12 pzs)', categoria: 'nuggets', precio: 8500, imagen: '🍗' },
  { id: 'n3', nombre: 'Nuggets (20 pzs)', categoria: 'nuggets', precio: 13500, imagen: '🍗' }
];

async function initDB() {
  try {
    console.log("🛠️ Limpiando y creando tablas en Turso...");

    // Tablas base
    await client.execute(`DROP TABLE IF EXISTS productos`);
    await client.execute(`DROP TABLE IF EXISTS pedidos`);
    // Tablas de finanzas (las reseteamos también para asegurar estructura)
    await client.execute(`DROP TABLE IF EXISTS cierres`);
    await client.execute(`DROP TABLE IF EXISTS finanzas`);

    // 1. Tabla de Productos
    await client.execute(`
      CREATE TABLE productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL DEFAULT 0,
        imagen TEXT,
        descripcion TEXT,
        tamanos TEXT
      )
    `);

    // 2. Tabla de Pedidos
    await client.execute(`
      CREATE TABLE pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numeroPedido TEXT NOT NULL,
        cliente TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        metodoPago TEXT,
        fecha TEXT NOT NULL
      )
    `);

    // 3. Tabla de Cierres (LO NUEVO)
    await client.execute(`
      CREATE TABLE cierres (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        totalVentas REAL NOT NULL,
        cantidadPedidos INTEGER NOT NULL
      )
    `);

    // 4. Tabla de Finanzas (LO NUEVO)
    await client.execute(`
      CREATE TABLE finanzas (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        descripcion TEXT,
        monto REAL NOT NULL,
        tipo TEXT NOT NULL
      )
    `);

    console.log("📥 Cargando menú de CoCo's Burger...");

    for (const p of PRODUCTOS) {
      await client.execute({
        sql: `INSERT INTO productos (id, nombre, categoria, precio, imagen, descripcion, tamanos) 
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

    console.log("✅ Base de datos reseteada y lista.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inicializando:", error);
    process.exit(1);
  }
}

initDB();
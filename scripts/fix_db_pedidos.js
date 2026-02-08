import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const arreglarBaseDeDatos = async () => {
  console.log("🔧 Iniciando reparación de la tabla 'pedidos'...");

  try {
    // 1. Intentamos agregar la columna. Si ya existe, fallará pero seguimos.
    try {
      await db.execute("ALTER TABLE pedidos ADD COLUMN numero_pedido INTEGER");
      console.log("✅ Columna 'numero_pedido' creada exitosamente.");
    } catch (error) {
      if (error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna 'numero_pedido' ya existía.");
      } else {
        throw error;
      }
    }

    // 2. Rellenamos los pedidos viejos que tengan NULL en esa columna
    // Usamos el propio ID (o un contador) para que no queden vacíos
    console.log("🔄 Rellenando números vacíos en pedidos viejos...");
    
    // Traemos todos los pedidos
    const res = await db.execute("SELECT id, usuario_id FROM pedidos WHERE numero_pedido IS NULL");
    
    let actualizados = 0;
    
    // Para cada usuario, reiniciamos el contador
    // Esto es una aproximación para arreglar lo viejo. Lo nuevo ya funcionará bien.
    const usuarios = [...new Set(res.rows.map(r => r.usuario_id))];

    for (const uid of usuarios) {
        // Pedidos de este usuario sin numero
        const pedidosUsuario = res.rows.filter(r => r.usuario_id === uid);
        let contador = 1;

        for (const p of pedidosUsuario) {
            await db.execute({
                sql: "UPDATE pedidos SET numero_pedido = ? WHERE id = ?",
                args: [contador, p.id]
            });
            contador++;
            actualizados++;
        }
    }

    console.log(`🎉 ¡Listo! Se actualizaron ${actualizados} pedidos viejos.`);

  } catch (error) {
    console.error("❌ Error fatal arreglando la DB:", error);
  }
};

arreglarBaseDeDatos();
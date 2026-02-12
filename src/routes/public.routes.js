import { Router } from 'express';
import { client } from '../db.js'; // 👈 IMPORTANTE: Usamos el cliente compartido
import crypto from 'crypto';

const router = Router();

// --- 1. OBTENER MENÚ PÚBLICO ---
// GET /api/public/menu/:usuario_id
router.get('/menu/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;

    console.log(`📡 Cliente escaneó QR de: ${usuario_id}`);

    try {
        const result = await client.execute({
            sql: "SELECT id, nombre, precio, categoria, imagen, descripcion, tamanos FROM productos WHERE usuario_id = ?",
            args: [usuario_id]
        });

        // Parseamos los tamaños para que el front no reciba strings raros
        const productos = result.rows.map(p => ({
            ...p,
            tamanos: typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : (p.tamanos || null)
        }));

        res.json(productos);

    } catch (error) {
        console.error("❌ ERROR MENÚ PÚBLICO:", error);
        res.status(500).json({ error: "No se pudo cargar el menú" });
    }
});

// --- 2. RECIBIR PEDIDO PÚBLICO ---
// POST /api/public/pedidos
router.post('/pedidos', async (req, res) => {
    // 👇 ACEPTAMOS 'items' O 'productos'
    const { cliente, items, productos, total, metodoPago, usuario_id, mesa } = req.body;

    console.log("📡 Recibiendo pedido público de:", cliente);

    if (!usuario_id) {
        return res.status(400).json({ error: "Falta el ID del local (usuario_id)" });
    }

    // 1. Normalizar: Usamos items si existe, sino productos
    const listaItems = items || productos || [];

    if (listaItems.length === 0) {
        return res.status(400).json({ error: "El pedido está vacío" });
    }

    try {
        const id = crypto.randomUUID();
        const fecha = new Date().toISOString();

        // 2. Calcular número de pedido visual (Ej: #45)
        const resNum = await client.execute({
            sql: "SELECT MAX(numero_pedido) as maximo FROM pedidos WHERE usuario_id = ?",
            args: [usuario_id]
        });
        const nuevoNumero = (resNum.rows[0]?.maximo || 0) + 1;

        // 3. Formatear cliente (Opcional, para que en cocina se vea de dónde viene)
        // Si querés guardar la mesa en su propia columna, avísame y cambiamos el INSERT.
        // Por ahora lo dejamos como lo tenías:
        const clienteFinal = mesa ? `${cliente} (Mesa ${mesa})` : `${cliente} (Web)`;

        // 4. Insertar en Base de Datos
        // Guardamos 'listaItems' (que ya está unificada)
        await client.execute({
            sql: `INSERT INTO pedidos (id, usuario_id, numero_pedido, cliente, productos, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                usuario_id,
                nuevoNumero,
                clienteFinal,
                JSON.stringify(listaItems), // 👈 Guardamos los items unificados
                total,
                'pendiente',
                metodoPago || 'Efectivo',
                fecha
            ]
        });

        console.log(`✅ Pedido #${nuevoNumero} guardado para local ${usuario_id}.`);

        res.status(201).json({
            message: "Pedido enviado",
            id,
            numeroPedido: nuevoNumero
        });

    } catch (error) {
        console.error("❌ ERROR PEDIDO PÚBLICO:", error);
        res.status(500).json({ error: "Error al procesar el pedido" });
    }
});

export default router;
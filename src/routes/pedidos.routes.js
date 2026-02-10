import { Router } from 'express';
import { client } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id, cliente, items, productos, total, metodoPago, fecha } = req.body;

    const listaProductos = productos || items;
    const itemsString = typeof listaProductos === 'string' ? listaProductos : JSON.stringify(listaProductos);

    // --- 🚨 VALIDACIÓN CRÍTICA ---
    if (!usuarioId) return res.status(400).json({ error: "Falta usuario" });

    // SI NO HAY ID, RECHAZAMOS EL PEDIDO. NO LO GUARDAMOS ROTO.
    if (!id) {
        console.error("❌ ERROR GRAVE: El frontend envió un pedido sin ID.");
        return res.status(400).json({ error: "Falta ID del pedido (UUID)" });
    }
    // -----------------------------

    try {
        // 1. CALCULAR NUMERO VISUAL
        const maxResult = await client.execute({
            sql: "SELECT MAX(numero_pedido) as maximo FROM pedidos WHERE usuario_id = ?",
            args: [usuarioId]
        });
        const nuevoNumero = (maxResult.rows[0]?.maximo || 0) + 1;
        const fechaFinal = fecha || new Date().toISOString();

        // 2. INSERTAR
        await client.execute({
            sql: `INSERT INTO pedidos (id, cliente, productos, total, estado, metodoPago, fecha, usuario_id, numero_pedido) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,  // <--- ESTO NO PUEDE SER NULL
                cliente || 'Consumidor Final',
                itemsString,
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal,
                usuarioId,
                nuevoNumero
            ]
        });

        console.log(`✅ Pedido creado: ${id} (#${nuevoNumero})`);

        res.status(201).json({
            id,
            cliente,
            productos: listaProductos,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaFinal,
            usuario_id: usuarioId,
            numeroPedido: nuevoNumero
        });

    } catch (error) {
        // DETECCIÓN DE DUPLICADOS
        const msg = error.message || "";
        if (msg.includes("UNIQUE") || msg.includes("PRIMARY") || error.code === "SQLITE_CONSTRAINT") {
            console.log(`🛑 DOBLE CLICK DETECTADO Y FRENADO: ID ${id}`);

            // Devolvemos el original para que el front no de error
            try {
                const existente = await client.execute({ sql: "SELECT * FROM pedidos WHERE id = ?", args: [id] });
                const p = existente.rows[0];
                return res.status(200).json({ ...p, productos: JSON.parse(p.productos), numeroPedido: p.numero_pedido });
            } catch (e) { return res.status(200).json({ id, numeroPedido: 0 }); }
        }

        console.error("❌ Error DB:", error);
        res.status(500).json({ error: "Error al guardar" });
    }
});

// --- GET, PATCH, DELETE (IGUAL QUE SIEMPRE) ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    if (!usuarioId) return res.status(400).json({ error: "Falta ID" });
    try {
        const result = await client.execute({ sql: "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY numero_pedido ASC", args: [usuarioId] });
        const pedidos = result.rows.map(r => ({ ...r, productos: typeof r.productos === 'string' ? JSON.parse(r.productos) : r.productos, numeroPedido: r.numero_pedido }));
        res.json(pedidos);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

router.patch('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params; const { estado } = req.body;
    try { await client.execute({ sql: "UPDATE pedidos SET estado = ? WHERE id = ? AND usuario_id = ?", args: [estado, id, usuarioId] }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: "Error" }); }
});

router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    try { await client.execute({ sql: "DELETE FROM pedidos WHERE id = ? AND usuario_id = ?", args: [id, usuarioId] }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: "Error" }); }
});

export default router;
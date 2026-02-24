import { Router } from 'express';
import { client } from '../db.js'; // Asegurate que la importación coincida con tu db.js (con llaves o sin)

const router = Router();

// --- CREAR PEDIDO ---
router.post('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    // 👇 AGREGAMOS direccionEntrega AL DESTRUCTURING
    const { id, cliente, items, productos, total, metodoPago, fecha, notas, direccionEntrega } = req.body;
    console.log("🚨 ATENCIÓN - DIRECCIÓN RECIBIDA:", direccionEntrega);
    // Normalizamos: Si viene 'items', usamos eso. Si no, 'productos'. Si no, array vacío.
    const listaItems = items || productos || [];

    // Convertimos a String para guardar en SQLite/Turso
    const itemsString = typeof listaItems === 'string' ? listaItems : JSON.stringify(listaItems);

    // --- 🚨 VALIDACIONES ---
    if (!usuarioId) {
        console.error("❌ Rechazado: Falta Header x-user-id");
        return res.status(400).json({ error: "Falta usuario (Header x-user-id)" });
    }

    if (!id) {
        console.error("❌ Rechazado: Falta UUID del pedido");
        return res.status(400).json({ error: "Falta ID del pedido (UUID)" });
    }
    // -----------------------

    try {
        // 1. CALCULAR NUMERO VISUAL (1, 2, 3...)
        const maxResult = await client.execute({
            sql: "SELECT MAX(numero_pedido) as maximo FROM pedidos WHERE usuario_id = ?",
            args: [usuarioId]
        });
        const nuevoNumero = (maxResult.rows[0]?.maximo || 0) + 1;

        // Fecha: Si el front la manda, la usamos. Si no, creamos una ahora.
        const fechaFinal = fecha || new Date().toISOString();

        // 2. INSERTAR EN BASE DE DATOS
        // 👇 AGREGAMOS direccion_entrega A LA CONSULTA SQL
        await client.execute({
            sql: `INSERT INTO pedidos (id, cliente, productos, total, estado, metodoPago, fecha, usuario_id, numero_pedido, notas, direccion_entrega) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                cliente || 'Consumidor Final',
                itemsString, // Guardamos el JSON string
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal,
                usuarioId,
                nuevoNumero,
                notas || '',
                direccionEntrega || null // 👇 GUARDAMOS LA DIRECCIÓN ACÁ
            ]
        });

        console.log(`✅ Pedido creado: #${nuevoNumero} (${listaItems.length} items)`);

        // 3. RESPONDER AL FRONTEND (Devolvemos 'items' y 'direccionEntrega')
        res.status(201).json({
            id,
            numeroPedido: nuevoNumero,
            cliente,
            items: listaItems,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaFinal,
            notas: notas || '',
            direccionEntrega: direccionEntrega || null // 👇 DEVOLVEMOS LA DIRECCIÓN
        });

    } catch (error) {
        // DETECCIÓN DE DUPLICADOS (Doble Click)
        const msg = error.message || "";
        if (msg.includes("UNIQUE") || msg.includes("PRIMARY") || error.code === "SQLITE_CONSTRAINT") {
            console.log(`🛑 Pedido duplicado detectado (ID: ${id}). Se ignora.`);

            // Intentamos devolver el pedido que ya existía para no romper el front
            try {
                const existente = await client.execute({ sql: "SELECT * FROM pedidos WHERE id = ?", args: [id] });
                const p = existente.rows[0];
                if (p) {
                    const parsedItems = typeof p.productos === 'string' ? JSON.parse(p.productos) : p.productos;
                    return res.status(200).json({
                        ...p,
                        items: parsedItems,
                        numeroPedido: p.numero_pedido,
                        direccionEntrega: p.direccion_entrega // 👇 MAPEO EN CASO DE DUPLICADO
                    });
                }
            } catch (e) { /* ignorar */ }

            return res.status(200).json({ id, status: 'existing' });
        }

        console.error("❌ Error DB al crear pedido:", error);
        res.status(500).json({ error: "Error interno al guardar pedido" });
    }
});

// --- GET: OBTENER PEDIDOS ---
router.get('/', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    if (!usuarioId) return res.status(400).json({ error: "Falta ID de usuario" });

    try {
        const result = await client.execute({
            sql: "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY numero_pedido DESC LIMIT 100",
            args: [usuarioId]
        });

        // TRANSFORMACIÓN DE DATOS (DB -> Frontend)
        const pedidos = result.rows.map(r => ({
            ...r,
            items: typeof r.productos === 'string' ? JSON.parse(r.productos) : r.productos,
            numeroPedido: r.numero_pedido,
            direccionEntrega: r.direccion_entrega // 👇 ESTO ES CLAVE PARA QUE EL FRONT LO VEA COMO direccionEntrega
        }));

        res.json(pedidos);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
});

// --- PATCH: ACTUALIZAR ESTADO ---
router.patch('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;
    const { estado } = req.body;

    try {
        await client.execute({
            sql: "UPDATE pedidos SET estado = ? WHERE id = ? AND usuario_id = ?",
            args: [estado, id, usuarioId]
        });
        res.json({ success: true });
    }
    catch (e) { res.status(500).json({ error: "Error actualizando estado" }); }
});

// --- DELETE: BORRAR PEDIDO ---
router.delete('/:id', async (req, res) => {
    const usuarioId = req.headers['x-user-id'];
    const { id } = req.params;

    try {
        await client.execute({
            sql: "DELETE FROM pedidos WHERE id = ? AND usuario_id = ?",
            args: [id, usuarioId]
        });
        res.json({ success: true });
    }
    catch (e) { res.status(500).json({ error: "Error eliminando pedido" }); }
});

export default router;
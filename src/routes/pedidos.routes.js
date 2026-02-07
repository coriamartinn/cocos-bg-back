// --- POST: Guardar un nuevo pedido ---
router.post('/', async (req, res) => {
    // 1. Extraemos los datos del body
    const { cliente, items, total, metodoPago, numeroPedido, fecha } = req.body;

    try {
        // 2. Si el front no manda fecha, la generamos nosotros (Garantiza que no sea NULL)
        const fechaFinal = fecha || new Date().toISOString();
        const numeroFinal = numeroPedido || `CC-${Math.floor(Math.random() * 9000) + 1000}`;

        console.log("Intentando guardar pedido con fecha:", fechaFinal);

        const result = await client.execute({
            sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                numeroFinal,
                cliente || 'Consumidor Final',
                typeof items === 'string' ? items : JSON.stringify(items),
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaFinal // <--- AQUÍ SE SOLUCIONA EL ERROR
            ]
        });

        // 3. Respondemos al frontend
        res.status(201).json({
            id: result.lastInsertRowid?.toString(),
            numeroPedido: numeroFinal,
            cliente: cliente || 'Consumidor Final',
            items: typeof items === 'string' ? JSON.parse(items) : items,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaFinal
        });
    } catch (error) {
        console.error("Error detallado en la inserción:", error.message);
        res.status(500).json({ error: "Error de base de datos", detalle: error.message });
    }
});
export default router;
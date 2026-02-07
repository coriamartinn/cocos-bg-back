router.post('/', async (req, res) => {
    try {
        const { cliente, items, total, metodoPago, numeroPedido } = req.body;

        // Validación manual: Si esto falla, el 500 es por datos incompletos
        if (!items || !total) {
            return res.status(400).json({ error: "Faltan items o total" });
        }

        const numeroFinal = numeroPedido || `CC-${Math.floor(Math.random() * 9000) + 1000}`;
        const fechaActual = new Date().toISOString();

        const result = await client.execute({
            sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                numeroFinal,
                cliente || 'Consumidor Final',
                typeof items === 'string' ? items : JSON.stringify(items),
                total,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaActual
            ]
        });

        res.status(201).json({
            id: result.lastInsertRowid?.toString(),
            numeroPedido: numeroFinal,
            cliente,
            items: typeof items === 'string' ? JSON.parse(items) : items,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaActual
        });
    } catch (error) {
        // ESTE LOG ES EL QUE TENÉS QUE BUSCAR EN KOYEB
        console.error("LOG CRÍTICO DB:", error.message);
        res.status(500).json({
            error: "Error interno del servidor",
            message: error.message, // Mandamos el mensaje al front para verlo en la consola
            stack: error.stack
        });
    }
});
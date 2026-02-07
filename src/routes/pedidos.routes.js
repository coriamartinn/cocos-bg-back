// --- POST: Guardar un nuevo pedido ---
router.post('/', async (req, res) => {
    // Recibimos los datos del frontend
    const { cliente, items, total, metodoPago, numeroPedido } = req.body;

    try {
        // Si el frontend no manda número, generamos uno (pero el de App.tsx ya debería llegar)
        const numeroFinal = numeroPedido || `CC-${Math.floor(Math.random() * 9000) + 1000}`;
        const fechaActual = new Date().toISOString();

        const result = await client.execute({
            sql: `INSERT INTO pedidos (numeroPedido, cliente, items, total, estado, metodoPago, fecha) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                numeroFinal,
                cliente || 'Consumidor Final',
                JSON.stringify(items), // Convertimos el array a string para SQLite/Turso
                total || 0,
                'pendiente',
                metodoPago || 'Efectivo',
                fechaActual // <--- IMPORTANTE: Guardar la fecha
            ]
        });

        // Respondemos al frontend con el ID que generó la base de datos
        res.status(201).json({
            id: result.lastInsertRowid?.toString(),
            numeroPedido: numeroFinal,
            cliente: cliente || 'Consumidor Final',
            items,
            total,
            estado: 'pendiente',
            metodoPago,
            fecha: fechaActual
        });
    } catch (error) {
        // Esto te va a decir en los logs de Koyeb exactamente qué columna falta
        console.error("Error detallado en DB:", error.message);
        res.status(500).json({ error: "Error de base de datos", detalle: error.message });
    }
});
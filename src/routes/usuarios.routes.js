import { Router } from 'express';
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// Conexión a la BD (Asegurate de que las variables de entorno coincidan con las de tu server.js)
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "libsql://cocos-burger-coriamartinn.aws-us-east-1.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzA0ODM5MzUsImlkIjoiYjFiM2JlYWItZTJhOC00YTQyLWI1YTgtMWMwMTYxMTNiNDIzIiwicmlkIjoiYjAzZTc3NjYtOGI4MC00OTM4LWE4ZGEtMDc5MjNhODY3NTAwIn0.5_1EJ8uiKgnQwq5FM0cj7fdVhmOHfsVbAnYHfkiWZTm2Bp_NmDiGqZsz7WmGUCBYX-WHfaLwCMHsAVYgfNAUCA"
});

// --- 1. LOGIN (Entrar al sistema) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscamos el usuario por email
        const result = await db.execute({
            sql: "SELECT * FROM usuarios WHERE email = ?",
            args: [email]
        });

        const usuario = result.rows[0];

        // Validaciones
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // NOTA: Para producción real, acá deberíamos usar bcrypt.compare()
        // Por ahora comparamos texto plano como definimos en el script anterior.
        if (usuario.password !== password) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // ¡Éxito! Devolvemos los datos (menos la password)
        // El frontend usará 'comprado' para decidir si muestra el bloqueo o la app.
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre_local: usuario.nombre_local,
                email: usuario.email,
                comprado: usuario.comprado // 1 = Pasa, 0 = Bloqueo
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// --- 2. REGISTER (Nuevo cliente potencial) ---
router.post('/register', async (req, res) => {
    const { email, password, nombre_local } = req.body;

    if (!email || !password || !nombre_local) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        // Creamos el usuario. Por defecto 'comprado' será 0 (definido en la BD)
        const id = crypto.randomUUID();

        await db.execute({
            sql: `INSERT INTO usuarios (id, email, password, nombre_local, comprado) 
            VALUES (?, ?, ?, ?, 0)`,
            args: [id, email, password, nombre_local]
        });

        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente. Pendiente de pago."
        });

    } catch (error) {
        // Si el email ya existe (error de constraint UNIQUE)
        if (error.message.includes("UNIQUE")) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
        console.error("Error en registro:", error);
        res.status(500).json({ error: "No se pudo registrar el usuario" });
    }
});

// --- 3. VERIFICAR (Para reconectar sesión) ---
// Sirve para consultar el estado actual si el usuario refresca la página
router.get('/estado/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.execute({
            sql: "SELECT comprado, nombre_local FROM usuarios WHERE id = ?",
            args: [id]
        });

        if (result.rows.length === 0) return res.status(404).send();

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send();
    }
});

export default router;
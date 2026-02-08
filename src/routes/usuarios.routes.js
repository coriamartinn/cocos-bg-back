import { Router } from 'express';
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import bcrypt from 'bcryptjs'; // <--- IMPORTANTE: Para seguridad
import crypto from 'crypto';   // <--- Para generar IDs

dotenv.config();

const router = Router();

// Conexión a la BD
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
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

        // Validaciones: ¿Existe el usuario?
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // SEGURIDAD: Comparamos la contraseña escrita con el Hash de la BD
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // ¡Éxito! Devolvemos los datos (sin la password)
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre_local: usuario.nombre_local,
                email: usuario.email,
                comprado: usuario.comprado // 1 = Puede usar la app, 0 = Bloqueado
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// --- 2. REGISTER (Nuevo cliente) ---
router.post('/register', async (req, res) => {
    const { email, password, nombre_local } = req.body;

    // Validación básica
    if (!email || !password || !nombre_local) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        // SEGURIDAD: Hasheamos la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const id = crypto.randomUUID();

        // Guardamos el usuario con la contraseña ENCRIPTADA y comprado = 0
        await db.execute({
            sql: `INSERT INTO usuarios (id, email, password, nombre_local, comprado) 
                  VALUES (?, ?, ?, ?, 0)`,
            args: [id, email, passwordHash, nombre_local]
        });

        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente. Pendiente de pago."
        });

    } catch (error) {
        // Si el email ya existe (error de constraint UNIQUE)
        if (error.message && error.message.includes("UNIQUE")) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }
        console.error("Error en registro:", error);
        res.status(500).json({ error: "No se pudo registrar el usuario" });
    }
});

// --- 3. VERIFICAR ESTADO (Para reconectar sesión o validar licencia) ---
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
        console.error("Error al verificar estado:", error);
        res.status(500).send();
    }
});

export default router;
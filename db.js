import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
});
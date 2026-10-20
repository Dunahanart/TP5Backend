import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

// ============================================================
//  [TP5 - consigna 2.4] Archivo de conexión con CONNECTION POOL
//
//  En Prisma 7 el cliente se conecta a través de un "adapter".
//  PrismaMariaDb crea y administra un pool de conexiones a MySQL:
//  en vez de abrir una conexión por consulta, reutiliza hasta
//  `connectionLimit` conexiones abiertas.
//
//  Los datos de conexión salen de DATABASE_URL (archivo .env):
//    DATABASE_URL="mysql://usuario:clave@host:puerto/base"
// ============================================================
const urlString = process.env.DATABASE_URL;
if (!urlString) {
    throw new Error('Falta la variable DATABASE_URL en el archivo .env');
}

const url = new URL(urlString);

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 10   // máximo de conexiones simultáneas del pool
});

// Una única instancia de PrismaClient para toda la aplicación
const prisma = new PrismaClient({ adapter });

export default prisma;

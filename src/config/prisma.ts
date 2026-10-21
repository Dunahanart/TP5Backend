import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

// Acá configuramos la conexión a la base de datos con Prisma
// Usamos un "pool de conexiones" que es básicamente tener varias
// conexiones abiertas para no abrir y cerrar una cada vez que llega un request
// Lo pedía la consigna 2.4 - Juan

const urlString = process.env.DATABASE_URL;
if (!urlString) {
    throw new Error('Falta la variable DATABASE_URL en el archivo .env');
}

// Parseamos la URL para sacar el host, puerto, usuario, etc
const url = new URL(urlString);

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 10,   // máximo 10 conexiones al mismo tiempo
    connectTimeout: 5000   // si la BD no responde en 5 segundos, falla rápido en vez de esperar ~10s
});

// Una sola instancia de Prisma para toda la app (si creás más de una rompe)
const prisma = new PrismaClient({ adapter });

export default prisma;

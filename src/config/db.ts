import mysql, { type Pool } from 'mysql2/promise';

// [Migración TS] Pool de conexiones a MySQL (antes era db.mjs).
// La configuración es la misma, solo cambia que ahora está tipada.
// Creamos la "flota" de conexiones
const pool: Pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Tu usuario de XAMPP (por defecto 'root')
    password: '',      // La contraseña de XAMPP (por defecto vacía)
    // [CORRECCION 1 del profesor] El script database.sql ahora crea y selecciona
    // `distribuidora_ipap`. Si cambiás el nombre ahí, cambienlo acá también,
    // si no la API queda apuntando a una base que no existe.
    database: 'distribuidora_ipap',
    waitForConnections: true,
    connectionLimit: 10,       // Límite máximo de conexiones simultáneas
    queueLimit: 0
});

export default pool;

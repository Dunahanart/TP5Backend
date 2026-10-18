import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// [Migración TS] Model de empleados (antes empleados.model.mjs)
class EmpleadoModel {
    // CREATE
    async crear(empleado: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, apellido, cargo } = empleado;
        const query = 'INSERT INTO empleados (nombre, apellido, cargo) VALUES (?, ?, ?)';
        // [CAMBIO TP4] Campos opcionales no enviados llegan como `undefined`
        // y mysql2 no los acepta en execute(): se normalizan a null
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, apellido, cargo].map(v => v ?? null)
        );
        return resultado;
    }

    // READ (acepta filtrados opcionales: /api/empleados?nombre=...&cargo=...)
    async obtenerTodos(filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        const mapaFiltros: Record<string, ReglaFiltro> = {
            nombre:   { columna: 'nombre', like: true },
            apellido: { columna: 'apellido', like: true },
            cargo:    { columna: 'cargo', like: true }
        };

        const condiciones: string[] = [];
        const valores: any[] = [];

        for (const [parametro, regla] of Object.entries(mapaFiltros)) {
            const valor = filtros[parametro];
            if (valor === undefined || valor === '') continue;

            if (regla.like) {
                condiciones.push(`${regla.columna} LIKE ?`);
                valores.push(`%${valor}%`);
            } else {
                const operador = regla.operador || '=';
                condiciones.push(`${regla.columna} ${operador} ?`);
                valores.push(valor);
            }
        }

        let query = 'SELECT * FROM empleados';
        if (condiciones.length > 0) query += ` WHERE ${condiciones.join(' AND ')}`;

        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION (SUM + COUNT + GROUP BY): pedidos atendidos y vendido por empleado
    async obtenerEstadisticas(): Promise<RowDataPacket[]> {
        const query = `
            SELECT e.id_empleado, e.nombre, e.apellido,
                   COUNT(p.id_pedido) AS pedidos,
                   IFNULL(SUM(p.total), 0) AS total_vendido
            FROM empleados e
            LEFT JOIN pedidos p ON e.id_empleado = p.id_empleado
            GROUP BY e.id_empleado, e.nombre, e.apellido
            ORDER BY total_vendido DESC
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas;
    }

    // READ by ID
    async obtenerPorId(id: string): Promise<RowDataPacket | undefined> {
        const query = 'SELECT * FROM empleados WHERE id_empleado = ?';
        const [filas] = await pool.execute<RowDataPacket[]>(query, [id]);
        return filas[0];
    }

    // UPDATE
    async actualizar(id: string, empleado: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, apellido, cargo } = empleado;
        const query = 'UPDATE empleados SET nombre = ?, apellido = ?, cargo = ? WHERE id_empleado = ?';
        // (misma normalización undefined → null que en crear)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, apellido, cargo, id].map(v => v ?? null)
        );
        return resultado;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados
    async actualizarParcial(id: string, empleado: Record<string, any>): Promise<ResultSetHeader | null> {
        const permitidas = ['nombre', 'apellido', 'cargo'];
        const campos = Object.entries(empleado).filter(([campo]) => permitidas.includes(campo));

        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE empleados SET ${sets} WHERE id_empleado = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);
        return resultado;
    }

    // DELETE
    async eliminar(id: string): Promise<ResultSetHeader> {
        const query = 'DELETE FROM empleados WHERE id_empleado = ?';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id]);
        return resultado;
    }
}

export default new EmpleadoModel();

import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// [Migración TS] Model de compañías de envío (antes companias.model.mjs)
class CompaniaModel {
    // CREATE
    async crear(compania: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, telefono } = compania;
        const query = 'INSERT INTO companias_envio (nombre, telefono) VALUES (?, ?)';
        // [CAMBIO TP4] Campos opcionales no enviados llegan como `undefined`
        // y mysql2 no los acepta en execute(): se normalizan a null
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, telefono].map(v => v ?? null)
        );
        return resultado;
    }

    // READ (acepta filtrados opcionales: /api/companias?nombre=...)
    async obtenerTodos(filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        const mapaFiltros: Record<string, ReglaFiltro> = {
            nombre:  { columna: 'nombre', like: true },
            telefono: { columna: 'telefono' }
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

        let query = 'SELECT * FROM companias_envio';
        if (condiciones.length > 0) query += ` WHERE ${condiciones.join(' AND ')}`;

        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION (COUNT + GROUP BY): pedidos que envió cada compañía
    async obtenerEstadisticas(): Promise<RowDataPacket[]> {
        const query = `
            SELECT c.id_compania, c.nombre, COUNT(p.id_pedido) AS pedidos
            FROM companias_envio c
            LEFT JOIN pedidos p ON c.id_compania = p.id_compania
            GROUP BY c.id_compania, c.nombre
            ORDER BY pedidos DESC
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas;
    }

    // READ by ID
    async obtenerPorId(id: string): Promise<RowDataPacket | undefined> {
        const query = 'SELECT * FROM companias_envio WHERE id_compania = ?';
        const [filas] = await pool.execute<RowDataPacket[]>(query, [id]);
        return filas[0];
    }

    // UPDATE
    async actualizar(id: string, compania: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, telefono } = compania;
        const query = 'UPDATE companias_envio SET nombre = ?, telefono = ? WHERE id_compania = ?';
        // (misma normalización undefined → null que en crear)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, telefono, id].map(v => v ?? null)
        );
        return resultado;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados
    async actualizarParcial(id: string, compania: Record<string, any>): Promise<ResultSetHeader | null> {
        const permitidas = ['nombre', 'telefono'];
        const campos = Object.entries(compania).filter(([campo]) => permitidas.includes(campo));

        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE companias_envio SET ${sets} WHERE id_compania = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);
        return resultado;
    }

    // DELETE
    async eliminar(id: string): Promise<ResultSetHeader> {
        const query = 'DELETE FROM companias_envio WHERE id_compania = ?';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id]);
        return resultado;
    }
}

export default new CompaniaModel();

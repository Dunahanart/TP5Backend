import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// [Migración TS] Model de clientes (antes clientes.model.mjs)
class ClienteModel {
    // CREATE
    async crear(cliente: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        const query = 'INSERT INTO clientes (nombre, apellido, dni, direccion, telefono) VALUES (?, ?, ?, ?, ?)';
        // [CAMBIO TP4] Campos opcionales no enviados llegan como `undefined`
        // y mysql2 no los acepta en execute(): se normalizan a null
        // (las columnas direccion/telefono son anulables en la BD)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, apellido, dni, direccion, telefono].map(v => v ?? null)
        );
        return resultado;
    }

    // READ (acepta filtrados opcionales: /api/clientes?dni=...&nombre=...)
    async obtenerTodos(filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        // Whitelist: parámetros de la URL → columnas reales de la tabla
        const mapaFiltros: Record<string, ReglaFiltro> = {
            dni:      { columna: 'dni' },                  // coincidencia exacta
            nombre:   { columna: 'nombre', like: true },   // búsqueda parcial
            apellido: { columna: 'apellido', like: true }
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

        let query = 'SELECT * FROM clientes';
        if (condiciones.length > 0) query += ` WHERE ${condiciones.join(' AND ')}`;

        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION: resumen de clientes (COUNT)
    async obtenerEstadisticas(): Promise<RowDataPacket> {
        const query = 'SELECT COUNT(*) AS cantidad, COUNT(telefono) AS con_telefono FROM clientes';
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas[0];
    }

    // READ by ID
    async obtenerPorId(id: string): Promise<RowDataPacket | undefined> {
        const query = 'SELECT * FROM clientes WHERE id_cliente = ?';
        const [filas] = await pool.execute<RowDataPacket[]>(query, [id]);
        return filas[0];
    }

    // UPDATE
    async actualizar(id: string, cliente: Record<string, any>): Promise<ResultSetHeader> {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        const query = 'UPDATE clientes SET nombre = ?, apellido = ?, dni = ?, direccion = ?, telefono = ? WHERE id_cliente = ?';
        // (misma normalización undefined → null que en crear)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [nombre, apellido, dni, direccion, telefono, id].map(v => v ?? null)
        );
        return resultado;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados
    async actualizarParcial(id: string, cliente: Record<string, any>): Promise<ResultSetHeader | null> {
        const permitidas = ['nombre', 'apellido', 'dni', 'direccion', 'telefono'];
        const campos = Object.entries(cliente).filter(([campo]) => permitidas.includes(campo));

        // Si no llega ningún campo válido, no hay nada que modificar
        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE clientes SET ${sets} WHERE id_cliente = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);
        return resultado;
    }

    // DELETE
    async eliminar(id: string): Promise<ResultSetHeader> {
        const query = 'DELETE FROM clientes WHERE id_cliente = ?';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id]);
        return resultado;
    }
}

export default new ClienteModel();

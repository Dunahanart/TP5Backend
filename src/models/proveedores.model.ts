import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// [Migración TS] Model de proveedores (antes proveedores.model.mjs)
class ProveedorModel {
    // POST: Crear proveedor en la BD
    async crear(proveedor: Record<string, any>): Promise<ResultSetHeader> {
        const { razon_social, cuit, telefono, email } = proveedor;

        // Cumplimos con la seguridad exigida usando consultas parametrizadas (?) para evitar Inyección SQL
        const query = 'INSERT INTO PROVEEDORES (razon_social, cuit, telefono, email) VALUES (?, ?, ?, ?)';

        // Usamos execute en lugar de query cuando pasamos parámetros dinámicos
        // [CAMBIO TP4] Campos opcionales no enviados llegan como `undefined`
        // y mysql2 no los acepta en execute(): se normalizan a null
        // (telefono/email/id_proveedor son anulables en la BD)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [razon_social, cuit, telefono, email].map(v => v ?? null)
        );
        return resultado;
    }

    // GET: Obtener todos los proveedores (acepta filtrados: /api/proveedores?razon_social=...)
    async obtenerTodos(filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        const mapaFiltros: Record<string, ReglaFiltro> = {
            razon_social: { columna: 'razon_social', like: true },
            cuit:         { columna: 'cuit' },
            email:        { columna: 'email', like: true }
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

        let query = 'SELECT * FROM PROVEEDORES';
        if (condiciones.length > 0) query += ` WHERE ${condiciones.join(' AND ')}`;

        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION (COUNT + GROUP BY): cuántos productos tiene cada proveedor
    async obtenerEstadisticas(): Promise<RowDataPacket[]> {
        const query = `
            SELECT pr.id_proveedor, pr.razon_social,
                   COUNT(p.id_producto) AS productos,
                   IFNULL(SUM(p.stock), 0) AS stock_total
            FROM PROVEEDORES pr
            LEFT JOIN productos p ON pr.id_proveedor = p.id_proveedor
            GROUP BY pr.id_proveedor, pr.razon_social
            ORDER BY productos DESC
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas;
    }

    // GET: Obtener un proveedor por su ID
    async obtenerPorId(id: string): Promise<RowDataPacket | undefined> {
        const [filas] = await pool.execute<RowDataPacket[]>('SELECT * FROM PROVEEDORES WHERE id_proveedor = ?', [id]);
        return filas[0];
    }

    // PUT: Actualizar un proveedor existente
    async actualizar(id: string, proveedor: Record<string, any>): Promise<ResultSetHeader> {
        const { razon_social, cuit, telefono, email } = proveedor;

        const query = 'UPDATE PROVEEDORES SET razon_social = ?, cuit = ?, telefono = ?, email = ? WHERE id_proveedor = ?';
        // (misma normalización undefined → null que en crear)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [razon_social, cuit, telefono, email, id].map(v => v ?? null)
        );

        return resultado;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados
    async actualizarParcial(id: string, proveedor: Record<string, any>): Promise<ResultSetHeader | null> {
        const permitidas = ['razon_social', 'cuit', 'telefono', 'email'];
        const campos = Object.entries(proveedor).filter(([campo]) => permitidas.includes(campo));

        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE PROVEEDORES SET ${sets} WHERE id_proveedor = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);

        return resultado;
    }

    // DELETE: Eliminar un proveedor
    async eliminar(id: string): Promise<ResultSetHeader> {
        const query = 'DELETE FROM PROVEEDORES WHERE id_proveedor = ?';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id]);

        return resultado;
    }
}

export default new ProveedorModel();

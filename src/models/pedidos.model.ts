import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// ============================================================
//  [CAMBIO TP4] Model de pedidos - Correcciones del profesor aplicadas:
//   * CORRECCION 4: el pedido ahora tiene 'estado'
//     (ENUM pendiente / enviado / entregado / cancelado)
//     - Se guarda en crear() y actualizar()
//     - Se muestra en obtenerTodos() y obtenerPorId()
//     - Se agrega como filtro: GET /api/pedidos?estado=entregado
//   * [CAMBIO interno] Los campos opcionales no enviados llegan como
//     `undefined` y mysql2 NO los acepta en execute(): se normalizan a null.
//  [Migración TS] Antes era pedidos.model.mjs.
// ============================================================
class PedidoModel {
    // CREATE
    async crear(pedido: Record<string, any>): Promise<ResultSetHeader> {
        // Si no mandan total, por defecto 0.00; si no mandan estado, 'pendiente'
        // (el mismo default que define la base de datos en la columna ENUM)
        const { total = 0.00, estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        const query = 'INSERT INTO pedidos (total, estado, id_cliente, id_empleado, id_compania) VALUES (?, ?, ?, ?, ?)';
        // [CAMBIO TP4] undefined → null: sin esto, crear un pedido sin id_empleado
        // revienta con "Bind parameters must not contain undefined" (500)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [total, estado, id_cliente, id_empleado, id_compania].map(v => v ?? null)
        );
        return resultado;
    }

    // READ (Acá aplicamos los JOINs + filtrados opcionales)
    async obtenerTodos(filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        // Whitelist: los filtros apuntan a los alias de las tablas del JOIN
        const mapaFiltros: Record<string, ReglaFiltro> = {
            cliente:  { columna: 'c.nombre', like: true },
            empleado: { columna: 'e.nombre', like: true },
            // [CORRECCION 4] Filtro nuevo: /api/pedidos?estado=entregado
            estado:   { columna: 'p.estado' },
            desde:    { columna: 'p.fecha', operador: '>=' },   // /api/pedidos?desde=2026-01-01
            hasta:    { columna: 'p.fecha', operador: '<'  }    // /api/pedidos?hasta=2026-12-31
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

        let query = `
            SELECT
                p.id_pedido,
                p.fecha,
                p.total,
                p.estado,                       -- [CORRECCION 4] El listado ahora muestra el estado
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                e.nombre AS empleado_nombre,
                e.apellido AS empleado_apellido,
                env.nombre AS compania_nombre
            FROM pedidos p
            LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
            LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
            LEFT JOIN companias_envio env ON p.id_compania = env.id_compania
        `;

        if (condiciones.length > 0) query += ` WHERE ${condiciones.join(' AND ')}`;

        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION: COUNT, SUM, AVG, MAX y MIN sobre los pedidos
    async obtenerEstadisticas(): Promise<RowDataPacket> {
        const query = `
            SELECT COUNT(*) AS cantidad,
                   SUM(total) AS total,
                   AVG(total) AS promedio,
                   MAX(total) AS maximo,
                   MIN(total) AS minimo
            FROM pedidos
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas[0];
    }

    // AGGREGATION (SUM + COUNT + JOIN + GROUP BY): cuánto gastó cada cliente
    async obtenerTotalesPorCliente(): Promise<RowDataPacket[]> {
        const query = `
            SELECT c.id_cliente, c.nombre, c.apellido,
                   COUNT(p.id_pedido) AS pedidos,
                   IFNULL(SUM(p.total), 0) AS total_gastado
            FROM clientes c
            LEFT JOIN pedidos p ON c.id_cliente = p.id_cliente
            GROUP BY c.id_cliente, c.nombre, c.apellido
            ORDER BY total_gastado DESC
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas;
    }

    // READ by ID
    async obtenerPorId(id: string): Promise<RowDataPacket | undefined> {
        const query = `
            SELECT p.*, c.nombre AS cliente, e.nombre AS empleado, env.nombre AS compania
            FROM pedidos p
            LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
            LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
            LEFT JOIN companias_envio env ON p.id_compania = env.id_compania
            WHERE p.id_pedido = ?
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query, [id]);
        return filas[0];
    }

    // UPDATE (Actualizar estado o total)
    async actualizar(id: string, pedido: Record<string, any>): Promise<ResultSetHeader> {
        // [CORRECCION 4] El PUT también actualiza el estado del pedido
        const { total, estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        const query = 'UPDATE pedidos SET total = ?, estado = ?, id_cliente = ?, id_empleado = ?, id_compania = ? WHERE id_pedido = ?';
        // (misma normalización undefined → null que en crear)
        const [resultado] = await pool.execute<ResultSetHeader>(
            query,
            [total, estado, id_cliente, id_empleado, id_compania, id].map(v => v ?? null)
        );
        return resultado;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados
    async actualizarParcial(id: string, pedido: Record<string, any>): Promise<ResultSetHeader | null> {
        // [CORRECCION 4] 'estado' entra en la whitelist de campos modificables
        const permitidas = ['total', 'estado', 'id_cliente', 'id_empleado', 'id_compania'];
        const campos = Object.entries(pedido).filter(([campo]) => permitidas.includes(campo));

        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE pedidos SET ${sets} WHERE id_pedido = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);
        return resultado;
    }

    // DELETE
    async eliminar(id: string): Promise<ResultSetHeader> {
        const query = 'DELETE FROM pedidos WHERE id_pedido = ?';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id]);
        return resultado;
    }
}

export default new PedidoModel();

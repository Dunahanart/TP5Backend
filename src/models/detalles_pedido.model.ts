import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ReglaFiltro } from '../types/filtros.js';

// ============================================================
//  [CAMBIO TP4] Model de detalles_pedido - Correcciones 2 y 3 del profesor:
//
//  CORRECCION 2 (precio histórico): la tabla ahora guarda precio_unitario.
//    El controller (detalles_pedido.controller.ts) busca el precio vigente
//    del producto, calcula el subtotal y recién ahí llama a crear().
//    Así, si el producto sube de precio mañana, el pedido viejo sigue
//    registrando a cuánto se vendió.
//
//  CORRECCION 3 (producto repetido): la tabla tiene UNIQUE (id_pedido, id_producto).
//    Si se intenta cargar dos veces el mismo producto en el mismo pedido,
//    MySQL responde ERROR 1062 y el errorHandler global lo traduce en 409.
//
//  [Migración TS] Antes era detalles_pedido.model.mjs.
// ============================================================
class DetallePedidoModel {
    // CREATE: Insertar una línea de producto en el pedido
    async crear(detalle: Record<string, any>): Promise<ResultSetHeader> {
        const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = detalle;
        // [CORRECCION 2] Se persiste el precio histórico junto a la cantidad
        const query = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)';
        const [resultado] = await pool.execute<ResultSetHeader>(query, [id_pedido, id_producto, cantidad, precio_unitario, subtotal]);
        return resultado;
    }

    // READ: Detalles de un pedido específico (filtro opcional: /api/detalles/pedido/1?producto=1)
    async obtenerPorPedido(id_pedido: string, filtros: Record<string, any> = {}): Promise<RowDataPacket[]> {
        const mapaFiltros: Record<string, ReglaFiltro> = {
            producto: { columna: 'dp.id_producto' }   // /api/detalles/pedido/1?producto=1
        };

        const condiciones: string[] = ['dp.id_pedido = ?'];
        const valores: any[] = [id_pedido];

        for (const [parametro, regla] of Object.entries(mapaFiltros)) {
            const valor = filtros[parametro];
            if (valor === undefined || valor === '') continue;

            condiciones.push(`${regla.columna} = ?`);
            valores.push(valor);
        }

        const query = `
            SELECT
                dp.id_detalle,
                dp.cantidad,
                dp.precio_unitario,            -- [CORRECCION 2] A cuánto se vendió en su momento
                dp.subtotal,
                p.id_producto,
                p.nombre AS producto_nombre,
                p.precio_unitario AS producto_precio   -- (precio VIGENTE, para comparar con el histórico)
            FROM detalles_pedido dp
            LEFT JOIN productos p ON dp.id_producto = p.id_producto
            WHERE ${condiciones.join(' AND ')}
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query, valores);
        return filas;
    }

    // AGGREGATION (SUM + JOIN + GROUP BY): productos más vendidos
    async obtenerProductosMasVendidos(): Promise<RowDataPacket[]> {
        const query = `
            SELECT p.id_producto, p.nombre,
                   SUM(d.cantidad) AS unidades_vendidas,
                   SUM(d.subtotal) AS facturado
            FROM detalles_pedido d
            INNER JOIN productos p ON d.id_producto = p.id_producto
            GROUP BY p.id_producto, p.nombre
            ORDER BY unidades_vendidas DESC
        `;
        const [filas] = await pool.query<RowDataPacket[]>(query);
        return filas;
    }

    // UPDATE PARCIAL (PATCH): actualiza solo los campos enviados de una línea de detalle
    async actualizarParcial(id: string, detalle: Record<string, any>): Promise<ResultSetHeader | null> {
        // [CORRECCION 2] 'precio_unitario' entra en la whitelist de campos modificables
        const permitidas = ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario', 'subtotal'];
        const campos = Object.entries(detalle).filter(([campo]) => permitidas.includes(campo));

        if (campos.length === 0) return null;

        const sets = campos.map(([campo]) => `${campo} = ?`).join(', ');
        const valores = campos.map(([, valor]) => valor);

        const query = `UPDATE detalles_pedido SET ${sets} WHERE id_detalle = ?`;
        const [resultado] = await pool.execute<ResultSetHeader>(query, [...valores, id]);
        return resultado;
    }
}

export default new DetallePedidoModel();

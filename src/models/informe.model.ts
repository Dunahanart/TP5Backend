import prisma from '../config/prisma.js';

// ============================================================
//  [TP5 - Consigna 3.4] Informe general con SQL puro ($queryRaw)
//
//  $queryRaw ejecuta SQL escrito a mano y retorna un array de objetos.
//  Se justifica aquí porque el informe combina varias tablas en una
//  sola consulta con cálculos complejos (SUM, COUNT, AVG, GROUP BY,
//  subconsultas) que serían muy difíciles de expresar con Prisma Client.
// ============================================================
class InformeModel {

    // ---------- SECCIÓN 1: Resumen general de la distribuidora ----------
    // Una sola consulta con subconsultas que devuelve un único registro
    // con los totales globales del negocio.
    async resumenGeneral() {
        const resultado = await prisma.$queryRaw<{
            total_clientes: bigint;
            total_proveedores: bigint;
            total_productos: bigint;
            total_empleados: bigint;
            total_pedidos: bigint;
            pedidos_pendientes: bigint;
            pedidos_enviados: bigint;
            pedidos_entregados: bigint;
            pedidos_cancelados: bigint;
            facturacion_total: number;
            ticket_promedio: number;
        }[]>`
            SELECT
                (SELECT COUNT(*) FROM clientes)                              AS total_clientes,
                (SELECT COUNT(*) FROM proveedores)                           AS total_proveedores,
                (SELECT COUNT(*) FROM productos)                             AS total_productos,
                (SELECT COUNT(*) FROM empleados)                             AS total_empleados,
                (SELECT COUNT(*) FROM pedidos)                               AS total_pedidos,
                (SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente')    AS pedidos_pendientes,
                (SELECT COUNT(*) FROM pedidos WHERE estado = 'enviado')      AS pedidos_enviados,
                (SELECT COUNT(*) FROM pedidos WHERE estado = 'entregado')    AS pedidos_entregados,
                (SELECT COUNT(*) FROM pedidos WHERE estado = 'cancelado')    AS pedidos_cancelados,
                (SELECT COALESCE(SUM(total), 0) FROM pedidos
                    WHERE estado != 'cancelado')                             AS facturacion_total,
                (SELECT COALESCE(AVG(total), 0) FROM pedidos
                    WHERE estado != 'cancelado')                             AS ticket_promedio
        `;

        // BigInt → Number para que JSON.stringify no falle
        const r = resultado[0];
        return {
            total_clientes:      Number(r.total_clientes),
            total_proveedores:   Number(r.total_proveedores),
            total_productos:     Number(r.total_productos),
            total_empleados:     Number(r.total_empleados),
            total_pedidos:       Number(r.total_pedidos),
            pedidos_pendientes:  Number(r.pedidos_pendientes),
            pedidos_enviados:    Number(r.pedidos_enviados),
            pedidos_entregados:  Number(r.pedidos_entregados),
            pedidos_cancelados:  Number(r.pedidos_cancelados),
            facturacion_total:   Number(r.facturacion_total),
            ticket_promedio:     Number(r.ticket_promedio)
        };
    }

    // ---------- SECCIÓN 2: Top 5 clientes por facturación ----------
    // JOIN entre clientes y pedidos + SUM + GROUP BY + ORDER BY + LIMIT
    async topClientesPorFacturacion() {
        const filas = await prisma.$queryRaw<{
            id_cliente: number;
            nombre: string;
            apellido: string;
            cantidad_pedidos: bigint;
            total_gastado: number;
        }[]>`
            SELECT
                c.id_cliente,
                c.nombre,
                c.apellido,
                COUNT(p.id_pedido)       AS cantidad_pedidos,
                COALESCE(SUM(p.total), 0) AS total_gastado
            FROM clientes c
            LEFT JOIN pedidos p
                ON p.id_cliente = c.id_cliente
                AND p.estado != 'cancelado'
            GROUP BY c.id_cliente, c.nombre, c.apellido
            ORDER BY total_gastado DESC
            LIMIT 5
        `;

        return filas.map(f => ({
            id_cliente:       f.id_cliente,
            nombre:           f.nombre,
            apellido:         f.apellido,
            cantidad_pedidos: Number(f.cantidad_pedidos),
            total_gastado:    Number(f.total_gastado)
        }));
    }

    // ---------- SECCIÓN 3: Productos con stock bajo (menor a 20 unidades) ----------
    // JOIN con proveedores + filtro WHERE stock < 20
    async productosStockBajo() {
        return prisma.$queryRaw<{
            id_producto: number;
            producto: string;
            stock: number;
            precio_unitario: number;
            proveedor: string;
        }[]>`
            SELECT
                pr.id_producto,
                pr.nombre         AS producto,
                pr.stock,
                pr.precio_unitario,
                COALESCE(pv.razon_social, 'Sin proveedor') AS proveedor
            FROM productos pr
            LEFT JOIN proveedores pv ON pv.id_proveedor = pr.id_proveedor
            WHERE pr.stock < 20
            ORDER BY pr.stock ASC
        `;
    }

    // ---------- SECCIÓN 4: Rendimiento de empleados ----------
    // JOIN entre empleados y pedidos + COUNT + SUM + GROUP BY
    async rendimientoEmpleados() {
        const filas = await prisma.$queryRaw<{
            id_empleado: number;
            nombre: string;
            apellido: string;
            cargo: string;
            pedidos_atendidos: bigint;
            pedidos_entregados: bigint;
            total_vendido: number;
        }[]>`
            SELECT
                e.id_empleado,
                e.nombre,
                e.apellido,
                COALESCE(e.cargo, 'Sin cargo') AS cargo,
                COUNT(p.id_pedido)              AS pedidos_atendidos,
                SUM(CASE WHEN p.estado = 'entregado' THEN 1 ELSE 0 END) AS pedidos_entregados,
                COALESCE(SUM(CASE WHEN p.estado != 'cancelado' THEN p.total ELSE 0 END), 0) AS total_vendido
            FROM empleados e
            LEFT JOIN pedidos p ON p.id_empleado = e.id_empleado
            GROUP BY e.id_empleado, e.nombre, e.apellido, e.cargo
            ORDER BY total_vendido DESC
        `;

        return filas.map(f => ({
            id_empleado:        f.id_empleado,
            nombre:             f.nombre,
            apellido:           f.apellido,
            cargo:              f.cargo,
            pedidos_atendidos:  Number(f.pedidos_atendidos),
            pedidos_entregados: Number(f.pedidos_entregados),
            total_vendido:      Number(f.total_vendido)
        }));
    }
}

export default new InformeModel();

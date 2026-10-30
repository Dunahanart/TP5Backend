import type { Schema } from 'express-validator';
import { enteroFiltro, enteroObligatorio, enteroOpcional, fechaFiltro, importeOpcional, textoFiltro } from './helpers.js';

// Esquemas de pedidos - capa de validación (express-validator)

// Tiene que coincidir con el ENUM pedidos_estado de la BD
export const ESTADOS_PEDIDO = ['pendiente', 'enviado', 'entregado', 'cancelado'];

// El estado es opcional: si no llega, el modelo le pone 'pendiente' (default de la BD)
const estadoPedido = {
    optional: true,
    isIn: { options: [ESTADOS_PEDIDO], errorMessage: `El estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}.` }
};

// POST /api/pedidos
export const crearPedido: Schema = {
    id_cliente: enteroObligatorio('id_cliente'),
    id_empleado: enteroOpcional('id_empleado', 1),
    id_compania: enteroOpcional('id_compania', 1),
    estado: estadoPedido,
    total: importeOpcional('total')
};

// PUT /api/pedidos/:id -> reemplaza el registro: el cliente sigue siendo obligatorio
export const actualizarPedido: Schema = { ...crearPedido };

// PATCH /api/pedidos/:id -> todo es opcional, se modifica solo lo que llega
export const actualizarPedidoParcial: Schema = {
    id_cliente: enteroOpcional('id_cliente', 1),
    id_empleado: enteroOpcional('id_empleado', 1),
    id_compania: enteroOpcional('id_compania', 1),
    estado: estadoPedido,
    total: importeOpcional('total')
};

// Filtros de GET /api/pedidos  (?cliente=ana&empleado=carlos&estado=entregado&desde=2026-09-01&hasta=2026-10-01)
export const filtrosPedido: Schema = {
    cliente: textoFiltro('cliente', 50),
    empleado: textoFiltro('empleado', 50),
    estado: {
        optional: { options: { values: 'falsy' } },
        isIn: { options: [ESTADOS_PEDIDO], errorMessage: `El estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}.` }
    },
    desde: fechaFiltro('desde'),
    hasta: fechaFiltro('hasta')
};

import type { Schema } from 'express-validator';
import { enteroFiltro, enteroObligatorio, enteroOpcional, importeObligatorio, importeOpcional } from './helpers.js';

// Esquemas de los detalles de pedido - capa de validación (express-validator)
//
// OJO: 'subtotal' NO está en ningún esquema, a propósito.
// El subtotal lo calcula SIEMPRE el servidor (cantidad x precio_unitario),
// igual que el precio_unitario que sale del producto en el momento de la venta.
//
// [TP5] id_pedido e id_producto ya NO se mandan en el body de PUT/PATCH:
// son la clave del detalle y vienen en la URL (/api/detalles/1/3).
// Solo el POST los recibe en el body, porque ahí se está creando el detalle nuevo.

// Clave del detalle en la URL: /api/detalles/:id_pedido/:id_producto
export const claveDetalleParams: Schema = {
    id_pedido: enteroObligatorio('id_pedido'),
    id_producto: enteroObligatorio('id_producto')
};

// POST /api/detalles
export const crearDetalle: Schema = {
    id_pedido: enteroObligatorio('id_pedido'),
    id_producto: enteroObligatorio('id_producto'),
    cantidad: enteroObligatorio('cantidad')
};

// PUT /api/detalles/:id_pedido/:id_producto -> reemplaza la venta de ese producto
export const actualizarDetalle: Schema = {
    cantidad: enteroObligatorio('cantidad'),
    precio_unitario: importeObligatorio('precio_unitario')
};

// PATCH /api/detalles/:id_pedido/:id_producto -> solo se valida lo que llega
export const actualizarDetalleParcial: Schema = {
    cantidad: enteroOpcional('cantidad', 1),
    precio_unitario: importeOpcional('precio_unitario')
};

// Filtros de GET /api/detalles  (?producto=3)
export const filtrosDetalle: Schema = {
    producto: enteroFiltro('producto', 1)
};

import type { Schema } from 'express-validator';
import { enteroFiltro, enteroObligatorio, enteroOpcional, importeFiltro, importeObligatorio, importeOpcional, textoFiltro, textoObligatorio, textoOpcional } from './helpers.js';

// Esquemas de productos - capa de validación (express-validator)
// Los límites salen de las columnas de database.sql

// POST /api/productos
export const crearProducto: Schema = {
    nombre: textoObligatorio('nombre', 100),
    descripcion: textoOpcional('descripcion', 2000),
    precio_unitario: importeObligatorio('precio_unitario'),
    stock: enteroOpcional('stock', 0),
    id_proveedor: enteroOpcional('id_proveedor', 1)
};

// PUT /api/productos/:id -> reemplaza el registro
export const actualizarProducto: Schema = { ...crearProducto };

// PATCH /api/productos/:id -> solo se valida lo que llega
export const actualizarProductoParcial: Schema = {
    nombre: textoOpcional('nombre', 100),
    descripcion: textoOpcional('descripcion', 2000),
    precio_unitario: importeOpcional('precio_unitario'),
    stock: enteroOpcional('stock', 0),
    id_proveedor: enteroOpcional('id_proveedor', 1)
};

// Filtros de GET /api/productos  (?nombre=...&proveedor=2&stock_min=10&precio_min=1000)
export const filtrosProducto: Schema = {
    nombre: textoFiltro('nombre', 100),
    proveedor: enteroFiltro('proveedor', 1),
    stock_min: enteroFiltro('stock_min', 0),
    stock_max: enteroFiltro('stock_max', 0),
    precio_min: importeFiltro('precio_min')
};

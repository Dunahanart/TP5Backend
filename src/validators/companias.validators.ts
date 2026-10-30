import type { Schema } from 'express-validator';
import { textoFiltro, textoObligatorio, textoOpcional } from './helpers.js';

// Esquemas de compañías de envío - capa de validación (express-validator)

// POST /api/companias
export const crearCompania: Schema = {
    nombre: textoObligatorio('nombre', 100),
    telefono: textoOpcional('telefono', 20)
};

// PUT /api/companias/:id -> reemplaza el registro
export const actualizarCompania: Schema = { ...crearCompania };

// PATCH /api/companias/:id -> solo se valida lo que llega
export const actualizarCompaniaParcial: Schema = {
    nombre: textoOpcional('nombre', 100),
    telefono: textoOpcional('telefono', 20)
};

// Filtros de GET /api/companias  (?nombre=...&telefono=...)
export const filtrosCompania: Schema = {
    nombre: textoFiltro('nombre', 100),
    telefono: textoFiltro('telefono', 20)
};

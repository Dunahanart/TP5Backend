import type { Schema } from 'express-validator';
import { textoFiltro, textoObligatorio, textoOpcional } from './helpers.js';

// Esquemas de empleados - capa de validación (express-validator)

// POST /api/empleados
export const crearEmpleado: Schema = {
    nombre: textoObligatorio('nombre', 50),
    apellido: textoObligatorio('apellido', 50),
    cargo: textoOpcional('cargo', 50)
};

// PUT /api/empleados/:id -> reemplaza el registro
export const actualizarEmpleado: Schema = { ...crearEmpleado };

// PATCH /api/empleados/:id -> solo se valida lo que llega
export const actualizarEmpleadoParcial: Schema = {
    nombre: textoOpcional('nombre', 50),
    apellido: textoOpcional('apellido', 50),
    cargo: textoOpcional('cargo', 50)
};

// Filtros de GET /api/empleados  (?nombre=...&apellido=...&cargo=...)
export const filtrosEmpleado: Schema = {
    nombre: textoFiltro('nombre', 50),
    apellido: textoFiltro('apellido', 50),
    cargo: textoFiltro('cargo', 50)
};

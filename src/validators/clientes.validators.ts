import type { Schema } from 'express-validator';
import { textoFiltro, textoObligatorio, textoOpcional } from './helpers.js';

// Esquemas de clientes - capa de validación (express-validator)

// POST /api/clientes
export const crearCliente: Schema = {
    nombre: textoObligatorio('nombre', 50),
    apellido: textoObligatorio('apellido', 50),
    dni: {
        isString: { errorMessage: "El campo 'dni' debe ser texto." },
        notEmpty: { errorMessage: "El campo 'dni' es obligatorio." },
        matches: { options: /^\d+$/, errorMessage: "El DNI debe contener solo números." },
        isLength: { options: { min: 7, max: 8 }, errorMessage: "El DNI debe tener entre 7 y 8 dígitos." }
    },
    direccion: textoOpcional('direccion', 150),
    telefono: textoOpcional('telefono', 20)
};

// PUT /api/clientes/:id -> reemplaza el registro, mismos campos obligatorios que el POST
export const actualizarCliente: Schema = { ...crearCliente };

// PATCH /api/clientes/:id -> solo se valida lo que efectivamente llega
export const actualizarClienteParcial: Schema = {
    nombre: textoOpcional('nombre', 50),
    apellido: textoOpcional('apellido', 50),
    dni: {
        optional: true,
        matches: { options: /^\d+$/, errorMessage: "El DNI debe contener solo números." },
        isLength: { options: { min: 7, max: 8 }, errorMessage: "El DNI debe tener entre 7 y 8 dígitos." }
    },
    direccion: textoOpcional('direccion', 150),
    telefono: textoOpcional('telefono', 20)
};

// Filtros de GET /api/clientes  (?dni=...&nombre=...&apellido=...)
export const filtrosCliente: Schema = {
    dni: textoFiltro('dni', 15),
    nombre: textoFiltro('nombre', 50),
    apellido: textoFiltro('apellido', 50)
};

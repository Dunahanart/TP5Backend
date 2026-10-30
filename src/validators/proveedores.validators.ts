import type { Schema } from 'express-validator';
import { textoFiltro, textoObligatorio, textoOpcional } from './helpers.js';

// Esquemas de proveedores - capa de validación (express-validator)

// POST /api/proveedores
export const crearProveedor: Schema = {
    razon_social: textoObligatorio('razon_social', 100),
    cuit: {
        isString: { errorMessage: "El campo 'cuit' debe ser texto." },
        notEmpty: { errorMessage: "El campo 'cuit' es obligatorio." },
        // Acepta el CUIT con o sin guiones (30-75000000-7 / 30750000007)
        matches: { options: /^[\d-]+$/, errorMessage: "El CUIT debe contener solo números y guiones." },
        isLength: { options: { min: 10, max: 13 }, errorMessage: "El CUIT debe tener entre 10 y 13 caracteres." }
    },
    telefono: textoOpcional('telefono', 20),
    email: {
        optional: true,
        isString: { errorMessage: "El campo 'email' debe ser texto." },
        isEmail: { errorMessage: "El formato del email no es válido." },
        isLength: { options: { max: 100 }, errorMessage: "El email no puede superar los 100 caracteres." }
    }
};

// PUT /api/proveedores/:id -> reemplaza el registro
export const actualizarProveedor: Schema = { ...crearProveedor };

// PATCH /api/proveedores/:id -> solo se valida lo que llega
export const actualizarProveedorParcial: Schema = {
    razon_social: textoOpcional('razon_social', 100),
    cuit: {
        optional: true,
        matches: { options: /^[\d-]+$/, errorMessage: "El CUIT debe contener solo números y guiones." },
        isLength: { options: { min: 10, max: 13 }, errorMessage: "El CUIT debe tener entre 10 y 13 caracteres." }
    },
    telefono: textoOpcional('telefono', 20),
    email: {
        optional: true,
        isString: { errorMessage: "El campo 'email' debe ser texto." },
        isEmail: { errorMessage: "El formato del email no es válido." },
        isLength: { options: { max: 100 }, errorMessage: "El email no puede superar los 100 caracteres." }
    }
};

// Filtros de GET /api/proveedores  (?razon_social=...&cuit=...&email=...)
export const filtrosProveedor: Schema = {
    razon_social: textoFiltro('razon_social', 100),
    cuit: textoFiltro('cuit', 15),
    email: textoFiltro('email', 100)
};

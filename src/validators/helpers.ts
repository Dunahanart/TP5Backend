import type { ParamSchema } from 'express-validator';

// Reglas compartidas de la capa de validación.
// Los largos máximos coinciden con las columnas de database.sql (VARCHAR(n)),
// así la validación de la API y las restricciones de la BD no se pelean - Juan

// Texto obligatorio, con largo mínimo y máximo
export const textoObligatorio = (campo: string, max: number, min = 2): ParamSchema => ({
    isString: { errorMessage: `El campo '${campo}' debe ser texto.` },
    notEmpty: { errorMessage: `El campo '${campo}' es obligatorio.` },
    isLength: { options: { min, max }, errorMessage: `El campo '${campo}' debe tener entre ${min} y ${max} caracteres.` }
});

// Texto opcional: si no llega no pasa nada; si llega tiene que ser texto y respetar el largo
export const textoOpcional = (campo: string, max: number): ParamSchema => ({
    optional: true,
    isString: { errorMessage: `El campo '${campo}' debe ser texto.` },
    isLength: { options: { max }, errorMessage: `El campo '${campo}' no puede superar los ${max} caracteres.` }
});

// Texto opcional para los filtros de la query (?nombre=...): admite el string vacío y lo ignora
export const textoFiltro = (campo: string, max: number): ParamSchema => ({
    optional: { options: { values: 'falsy' } },
    isString: { errorMessage: `El parámetro '${campo}' debe ser texto.` },
    isLength: { options: { max }, errorMessage: `El parámetro '${campo}' no puede superar los ${max} caracteres.` }
});

// Entero obligatorio (ids, cantidades): no existen ids ni cantidades en cero
export const enteroObligatorio = (campo: string, min = 1): ParamSchema => ({
    isInt: { options: { min }, errorMessage: `El campo '${campo}' debe ser un número entero mayor o igual a ${min}.` }
});

// Entero opcional (stock, ids de relaciones que pueden no venir)
export const enteroOpcional = (campo: string, min = 0): ParamSchema => ({
    optional: true,
    isInt: { options: { min }, errorMessage: `El campo '${campo}' debe ser un número entero mayor o igual a ${min}.` }
});

// Entero opcional para filtros de la query (?stock_min=10)
export const enteroFiltro = (campo: string, min = 0): ParamSchema => ({
    optional: { options: { values: 'falsy' } },
    isInt: { options: { min }, errorMessage: `El parámetro '${campo}' debe ser numérico.` }
});

// Importe obligatorio (precio_unitario): admite enteros y decimales, nunca negativo
export const importeObligatorio = (campo: string): ParamSchema => ({
    isFloat: { options: { min: 0 }, errorMessage: `El campo '${campo}' no puede ser negativo.` }
});

// Importe opcional (total): lo mismo pero solo si viene en el body
export const importeOpcional = (campo: string): ParamSchema => ({
    optional: true,
    isFloat: { options: { min: 0 }, errorMessage: `El campo '${campo}' no puede ser negativo.` }
});

// Importe opcional para filtros de la query (?precio_min=1000)
export const importeFiltro = (campo: string): ParamSchema => ({
    optional: { options: { values: 'falsy' } },
    isFloat: { options: { min: 0 }, errorMessage: `El parámetro '${campo}' debe ser numérico.` }
});

// Fecha opcional para filtros de la query (?desde=2026-09-01)
export const fechaFiltro = (campo: string): ParamSchema => ({
    optional: { options: { values: 'falsy' } },
    isISO8601: { errorMessage: `El parámetro '${campo}' debe ser una fecha válida (AAAA-MM-DD).` }
});

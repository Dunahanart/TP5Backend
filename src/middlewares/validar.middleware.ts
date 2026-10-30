import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { checkSchema, matchedData, validationResult } from 'express-validator';
import type { Location, Schema } from 'express-validator';

// Capa de validación de la API - lo visto en la clase de Validaciones (express-validator)
//
// Se ubica ANTES del controller, en la ruta:
//     router.post('/', validar(crearCliente), clienteController.crear)
//
// Si la petición no cumple el esquema, corta con 400 y el controller nunca se entera:
// los controllers quedan solo con lógica de negocio (buscar, persistir, responder).
// La BD sigue siendo la última barrera (CHECK, UNIQUE, FK): esto es defensa en profundidad.

export function validar(esquema: Schema, ubicacion: Location = 'body'): RequestHandler[] {
    return [
        // checkSchema arma los middlewares de express-validator para cada campo del esquema
        ...checkSchema(esquema, [ubicacion]),

        (req: Request, res: Response, next: NextFunction) => {
            const errores = validationResult(req);

            if (!errores.isEmpty()) {
                res.status(400).json({
                    error: "Datos inválidos en la petición.",
                    // Detalle campo por campo para que el cliente sepa qué corregir.
                    // 'path' solo existe en los errores de campo (ValidationError es un tipo unión)
                    detalles: errores.array().map(e => ({
                        campo: 'path' in e ? e.path : '(general)',
                        mensaje: e.msg
                    }))
                });
                return;
            }

            // Reemplazamos el body por los datos ya validados (matchedData).
            // Así lo que llega al controller no puede traer basura ni campos desconocidos.
            if (ubicacion === 'body') {
                req.body = matchedData(req, { locations: ['body'] });
            }

            next();
        }
    ];
}

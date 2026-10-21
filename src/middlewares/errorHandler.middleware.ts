import type { NextFunction, Request, Response } from 'express';

// Interfaz para tipar los errores que manda Prisma o Express
// code lo usa Prisma (P2002, P2003, P2025...) y type lo usa Express cuando el JSON viene mal
interface ErrorBD extends Error {
    code?: string;
    type?: string;
}

// Este middleware captura todos los errores que los controllers mandan con next(error)
// Se registra al final del app.ts para que funcione bien - Leo
// Si no lo ponés al final no funciona, lo aprendimos a las malas
class ErrorHandler {
    manejar(err: ErrorBD, req: Request, res: Response, next: NextFunction): void {
        // Imprimimos el error en la consola del servidor para poder debuggear
        console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.code ?? err.name, '-', err.message.split('\n').pop());

        if (res.headersSent) {
            return next(err);
        }

        // Si el JSON del body viene mal formado
        if (err.type === 'entity.parse.failed') {
            res.status(400).json({ error: "JSON inválido en el cuerpo de la petición." });
            return;
        }

        // Errores de Prisma - cada código es un tipo de error distinto
        switch (err.code) {
            case 'P2002':
                // DNI o CUIT duplicado
                res.status(409).json({ error: "Ya existe un registro con ese valor (dato duplicado)." });
                return;
            case 'P2003':
                // Error de clave foránea - distinto si es borrado o creación
                if (req.method === 'DELETE') {
                    res.status(409).json({ error: "No se puede eliminar: el registro tiene datos asociados." });
                } else {
                    res.status(400).json({ error: "Referencia inexistente: el ID indicado no existe." });
                }
                return;
            case 'P2025':
                // El registro que querías modificar o borrar no existe
                res.status(404).json({ error: "Registro no encontrado." });
                return;
        }

        // Cuando Prisma detecta que los datos no tienen el formato correcto
        if (err.name === 'PrismaClientValidationError') {
            res.status(400).json({ error: "Datos inválidos: revisá los campos enviados." });
            return;
        }

        // Cualquier otro error que no previmos
        res.status(500).json({ error: "Error interno del servidor." });
    }
}

export default new ErrorHandler();

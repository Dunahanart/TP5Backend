import type { NextFunction, Request, Response } from 'express';

// Forma del error que emiten Prisma y express.json.
// No vienen tipados en las librerías, así que lo declaramos nosotros.
interface ErrorBD extends Error {
    code?: string;    // Prisma: 'P2002', 'P2025', 'P2003'...
    type?: string;    // express.json: 'entity.parse.failed' (JSON malformado)
}

// ============================================================
//  Manejador GLOBAL de errores (TP5 - consigna 2.5)
//
//  Se registra en app.ts DESPUÉS de todas las rutas. Recibe los errores
//  que los controllers delegan con next(error) y los traduce en
//  respuestas HTTP claras, SIN stack trace ni SQL crudo:
//
//    Prisma P2002 (valor único repetido: dni, cuit...)  → 409
//    Prisma P2003 (clave foránea): al borrar            → 409
//                                  al crear / editar    → 400
//    Prisma P2025 (registro no encontrado)              → 404
//    Prisma ValidationError (faltan / sobran campos)    → 400
//    JSON malformado en el body                         → 400
//    cualquier otra excepción                           → 500 genérico
//
//  El error real se loguea solo en el servidor; jamás se expone al cliente.
// ============================================================
class ErrorHandler {
    manejar(err: ErrorBD, req: Request, res: Response, next: NextFunction): void {
        console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.code ?? err.name, '-', err.message.split('\n').pop());

        // Si la respuesta ya salió, dejamos que Express cierre la conexión
        if (res.headersSent) {
            return next(err);
        }

        // Cuerpo JSON malformado
        if (err.type === 'entity.parse.failed') {
            res.status(400).json({ error: "JSON inválido en el cuerpo de la petición." });
            return;
        }

        // ---------- Errores de Prisma ----------
        switch (err.code) {
            case 'P2002':
                res.status(409).json({ error: "Ya existe un registro con ese valor (dato duplicado)." });
                return;
            case 'P2003':
                if (req.method === 'DELETE') {
                    res.status(409).json({ error: "No se puede eliminar: el registro tiene datos asociados." });
                } else {
                    res.status(400).json({ error: "Referencia inexistente: el ID indicado no existe." });
                }
                return;
            case 'P2025':
                res.status(404).json({ error: "Registro no encontrado." });
                return;
        }

        // Prisma rechaza la consulta antes de ejecutarla (campo faltante, tipo incorrecto)
        if (err.name === 'PrismaClientValidationError') {
            res.status(400).json({ error: "Datos inválidos: revisá los campos enviados." });
            return;
        }

        // Cualquier otra excepción: 500 genérico sin stack trace
        res.status(500).json({ error: "Error interno del servidor." });
    }
}

export default new ErrorHandler();

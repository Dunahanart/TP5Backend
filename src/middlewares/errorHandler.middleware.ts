import type { NextFunction, Request, Response } from 'express';

// [Migración TS] Forma del error que emite mysql2 / express-json.
// No viene tipado en las librerías, así que lo declaramos nosotros.
interface ErrorMySQL extends Error {
    code?: string;    // ej: 'ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2'
    errno?: number;   // ej: 1062 (duplicado), 3819 (CHECK violado)
    type?: string;    // ej: 'entity.parse.failed' (JSON malformado)
}

// ============================================================
//  [ARCHIVO NUEVO - TP4] Manejador GLOBAL de errores (consigna 3.4)
//
//  Se registra en app.ts DESPUÉS de todas las rutas. Recibe los errores
//  que los controllers delegan con next(error) y los traduce en
//  respuestas HTTP claras:
//    * 1062 duplicado (DNI, UNIQUE pedido+producto)  → 409
//    * FK con datos asociados (eliminar con detalles) → 409
//    * 3819 CHECK violado (stock/precio negativo)    → 400
//    * FK inexistente / JSON roto en el body         → 400
//    * cualquier otra excepción                      → 500 genérico
//  El error real se loguea en consola del servidor; jamás se expone al cliente.
// ============================================================
class ErrorHandler {
    manejar(err: ErrorMySQL, req: Request, res: Response, next: NextFunction): void {
        // El error real se loguea en el servidor, jamás se devuelve al cliente
        console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

        // Si la respuesta ya salió, dejamos que Express cierre la conexión
        if (res.headersSent) {
            return next(err);
        }

        // Cuerpo JSON malformado
        if (err.type === 'entity.parse.failed') {
            res.status(400).json({ error: "JSON inválido en el cuerpo de la petición." });
            return;
        }

        // Errores de MySQL → códigos HTTP semánticos
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                res.status(409).json({ error: "Ya existe un registro con ese valor (dato duplicado)." });
                return;
            case 'ER_NO_REFERENCED_ROW_2':
                res.status(400).json({ error: "Referencia inexistente: el ID indicado no existe." });
                return;
            case 'ER_ROW_IS_REFERENCED_2':
                res.status(409).json({ error: "No se puede eliminar: el registro tiene datos asociados." });
                return;
            case 'ER_CHECK_CONSTRAINT_VIOLATED':
            case 'ER_CONSTRAINT_FAILED':
                res.status(400).json({ error: "Valor no permitido por las restricciones de la base de datos." });
                return;
        }

        // MariaDB informa el CHECK violado con estos números de error
        if (err.errno === 3819 || err.errno === 4025) {
            res.status(400).json({ error: "Valor no permitido por las restricciones de la base de datos." });
            return;
        }

        // Cualquier otra excepción: 500 genérico sin stack trace
        res.status(500).json({ error: "Error interno del servidor." });
    }
}

export default new ErrorHandler();

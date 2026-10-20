// [TP5] Utilidades para leer parámetros de la URL.
// El id llega como texto ("5"); Prisma necesita un número entero.

// Convierte el parámetro a número entero positivo; si no es válido devuelve null.
export function leerId(valor: unknown): number | null {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Mensaje estándar para responder 400 cuando el id no es válido
export const ID_INVALIDO = { error: "El ID debe ser un número entero positivo." };

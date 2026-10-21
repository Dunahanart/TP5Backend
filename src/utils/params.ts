// Funciones de utilidad para leer parámetros de la URL
// El id llega como string ("5") pero Prisma necesita un número, por eso lo convertimos - Leo

export function leerId(valor: unknown): number | null {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Mensaje que reutilizamos en todos los controllers cuando el id no es válido
export const ID_INVALIDO = { error: "El ID debe ser un número entero positivo." };

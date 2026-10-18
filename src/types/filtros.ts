// ============================================================
//  [NUEVO - Migración TS] Tipos compartidos por los models
//
//  ReglaFiltro describe cada filtro permitido del sistema de
//  filtrados dinámicos (whitelist → WHERE parametrizado):
//    columna:  nombre real de la columna en la BD (nunca lo escribe
//              el cliente: el mapa de filtros es una whitelist)
//    like:     si es true se busca coincidencia parcial (LIKE %valor%)
//    operador: '>=' / '<=' / '>' / '<' (por defecto '=')
// ============================================================
export interface ReglaFiltro {
    columna: string;
    like?: boolean;
    operador?: string;
}

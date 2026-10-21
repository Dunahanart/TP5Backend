import type { NextFunction, Request, Response } from 'express';
import informeModel from '../models/informe.model.js';

// Consigna 3.4 - ruta que genera un informe usando SQL puro ($queryRaw)
// Ejecutamos las 4 consultas al mismo tiempo con Promise.all para que sea más rápido - Juan
// TODO: estaría bueno agregar filtro por fecha al informe en algún momento

class InformeController {
    async generarInforme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const [resumen, topClientes, stockBajo, empleados] = await Promise.all([
                informeModel.resumenGeneral(),
                informeModel.topClientesPorFacturacion(),
                informeModel.productosStockBajo(),
                informeModel.rendimientoEmpleados()
            ]);

            res.status(200).json({
                titulo: 'Informe General – Distribuidora IPAP',
                generado_en: new Date().toISOString(),
                resumen_general: resumen,
                top_5_clientes_por_facturacion: topClientes,
                productos_con_stock_bajo: stockBajo,
                rendimiento_empleados: empleados
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InformeController();

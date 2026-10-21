import type { NextFunction, Request, Response } from 'express';
import informeModel from '../models/informe.model.js';

// ============================================================
//  [TP5 - Consigna 3.4] Controller del informe
//  Llama al model que usa $queryRaw (SQL puro) y arma la respuesta JSON.
// ============================================================
class InformeController {
    async generarInforme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Las cuatro secciones se ejecutan en paralelo para mayor performance
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

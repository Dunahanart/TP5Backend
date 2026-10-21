import morgan from 'morgan';
import express, { type NextFunction, type Request, type Response } from 'express';
import prisma from './config/prisma.js';
// [ARCHIVO NUEVO TP4] Manejador global de errores - ver comentario al registrarlo más abajo
import errorHandler from './middlewares/errorHandler.middleware.js';

import proveedoresRoutes from './routes/proveedores.routes.js';
import productosRoutes from './routes/productos.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import companiasRoutes from './routes/companias.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import detallesPedidoRoutes from './routes/detalles_pedido.routes.js';
import informeRoutes from './routes/informe.routes.js';

// [Migración TS] La app vive en app.ts (exportada) y el arranque (app.listen)
// vive en index.ts, igual que el ejemplo de la cátedra.
const app = express();

app.use(morgan('combined'));
app.use(express.json());

// [TP5] Ping a la base de datos con SQL puro ($queryRaw).
// Sirve para comprobar que la conexión de Prisma funciona.
app.get('/api/ping', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await prisma.$queryRaw<{ mensaje: string }[]>`SELECT 'Conexion exitosa a MySQL Distribuidora' AS mensaje`;
        res.status(200).json(result[0]);
    } catch (error) {
        next(error);
    }
});

// Rutas de cada recurso
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/companias', companiasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/detalles', detallesPedidoRoutes);
// [TP5 - Consigna 3.4] Ruta del informe generado con SQL puro ($queryRaw)
app.use('/api/informe', informeRoutes);

// ============================================================
//  [CAMBIO TP4] Manejador global de errores: SIEMPRE al final, después de
//  todas las rutas. Los controllers que detectan un error de base de datos
//  llaman next(error) y el error cae acá: el errorHandler responde
//  409 (duplicados / claves foráneas), 404 (no existe), 400 (datos inválidos)
//  o 500 genérico, con el error real logueado solo en el servidor.
// ============================================================
app.use(errorHandler.manejar);

export default app;

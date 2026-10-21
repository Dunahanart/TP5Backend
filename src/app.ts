import morgan from 'morgan';
import express, { type NextFunction, type Request, type Response } from 'express';
import prisma from './config/prisma.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

import proveedoresRoutes from './routes/proveedores.routes.js';
import productosRoutes from './routes/productos.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import companiasRoutes from './routes/companias.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import detallesPedidoRoutes from './routes/detalles_pedido.routes.js';
import informeRoutes from './routes/informe.routes.js';

const app = express();

app.use(morgan('combined')); // morgan loguea cada request en la consola
app.use(express.json());

// Ruta de prueba para ver si la conexión a la BD anda
// Usamos $queryRaw que es SQL puro - si esto responde bien, todo está ok
app.get('/api/ping', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await prisma.$queryRaw<{ mensaje: string }[]>`SELECT 'Conexion exitosa a MySQL Distribuidora' AS mensaje`;
        res.status(200).json(result[0]);
    } catch (error) {
        next(error);
    }
});

app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/companias', companiasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/detalles', detallesPedidoRoutes);
app.use('/api/informe', informeRoutes);

// El errorHandler SIEMPRE va al final, después de todas las rutas
// Si lo ponés antes no captura los errores - Juan
app.use(errorHandler.manejar);

export default app;

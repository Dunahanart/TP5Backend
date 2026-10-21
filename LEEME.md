# TP5 – Backend Distribuidora (TypeScript + Express + Prisma)

API REST para administrar una distribuidora de productos alimenticios y bebidas.
Stack: **Node.js + Express 5 + TypeScript + Prisma ORM (v7) + MySQL/MariaDB**.

Materia: Backend – Tec. Superior en Desarrollo de Software Full Stack (IPAP).

---

## 1. Requisitos

- **Node.js** instalado (comprobalo con `node -v`).
- **XAMPP** con el módulo **MySQL** iniciado (o cualquier MySQL/MariaDB local).
- **Git**.

## 2. Puesta en marcha (paso a paso)

Estos pasos hay que hacerlos una vez en cada computadora, porque `node_modules` y `.env` **no se suben a GitHub**.

### Paso 1 – Bajar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd TP5Backend
```

(Si ya lo tenés clonado, alcanza con `git pull`.)

### Paso 2 – Instalar las dependencias

```bash
npm install
```

### Paso 3 – Crear el archivo `.env`

Creá un archivo llamado `.env` en la raíz del proyecto (al lado de `package.json`) con este contenido:

```
DATABASE_URL="mysql://root:@localhost:3306/distribuidora_ipap"
```

Formato: `mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE`.
Con XAMPP por defecto el usuario es `root` y la contraseña está vacía. Si en tu MySQL tenés contraseña, escribila después de los dos puntos.

### Paso 4 – Crear la base de datos

1. Prendé MySQL en XAMPP (botón **Start**).
2. Entrá a phpMyAdmin: <http://localhost/phpmyadmin>
3. Pestaña **Importar** → elegí el archivo **`database.sql`** de la raíz del proyecto → **Importar**.

El script crea la base `distribuidora_ipap`, todas las tablas y datos de ejemplo.
Se puede volver a importar cuando quieras: borra las tablas y las recrea (**se pierden los datos que hayas cargado**).

### Paso 5 – Generar el cliente de Prisma

```bash
npx prisma generate --config prisma7.config.ts
```

Esto crea la carpeta `src/generated/prisma` (no se sube a GitHub).

### Paso 6 – Levantar el servidor

```bash
npm run dev
```

Tiene que aparecer: `Servidor de la Distribuidora corriendo en http://localhost:3000`.

### Paso 7 – Probar que anda

Abrí en el navegador:

- <http://localhost:3000/api/ping> → `{"mensaje":"Conexion exitosa a MySQL Distribuidora"}`
- <http://localhost:3000/api/clientes> → lista de clientes

---

## 3. Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor con nodemon (se reinicia solo al guardar cambios en `src/`) |
| `npm start` | Levanta el servidor una vez, sin reinicio automático |
| `npm run typecheck` | Revisa los tipos de TypeScript (si no imprime nada, no hay errores) |

> El proyecto **no genera archivos `.js`**: `tsx` ejecuta el TypeScript directo y `tsc` solo chequea tipos (`noEmit: true`).

---

## 4. Estructura del proyecto

```
TP5Backend/
├── database.sql              ← script para recrear la base de datos
├── prisma/
│   ├── schema.prisma         ← modelos de Prisma (tablas y relaciones)
│   └── migrations/           ← migraciones generadas por Prisma
├── prisma7.config.ts         ← configuración de Prisma (lee DATABASE_URL)
├── src/
│   ├── index.ts              ← arranque del servidor (app.listen)
│   ├── app.ts                ← Express, rutas y manejador de errores
│   ├── config/prisma.ts      ← conexión a la BD con Connection Pool
│   ├── routes/               ← Routers: definen las URLs
│   ├── controllers/          ← Controllers: validan y responden HTTP
│   ├── models/               ← Models: acceso a datos con Prisma
│   ├── middlewares/          ← errorHandler global
│   └── utils/params.ts       ← lectura/validación de ids de la URL
└── LEEME.md
```

**Patrón de diseño:** `Router → Controller → Model → Prisma → MySQL`.
Los *Models* son la única capa que habla con la base de datos.

---

## 5. Endpoints

Base: `http://localhost:3000`

Todos los recursos (excepto detalles) tienen las mismas rutas CRUD:

| Método | Ruta | Acción |
|---|---|---|
| `POST` | `/api/<recurso>` | Crear |
| `GET` | `/api/<recurso>` | Listar (con filtros opcionales) |
| `GET` | `/api/<recurso>/estadisticas` | Estadísticas / agregaciones |
| `GET` | `/api/<recurso>/:id` | Obtener uno |
| `PUT` | `/api/<recurso>/:id` | Reemplazar |
| `PATCH` | `/api/<recurso>/:id` | Modificar solo algunos campos |
| `DELETE` | `/api/<recurso>/:id` | Eliminar |

| Recurso | Ruta | Filtros del `GET` | Campos del body |
|---|---|---|---|
| Clientes | `/api/clientes` | `nombre`, `apellido`, `dni` | `nombre`*, `apellido`*, `dni`*, `direccion`, `telefono` |
| Proveedores | `/api/proveedores` | `razon_social`, `cuit`, `email` | `razon_social`*, `cuit`*, `telefono`, `email` |
| Productos | `/api/productos` | `nombre`, `stock_min`, `stock_max`, `precio_min`, `proveedor` | `nombre`*, `precio_unitario`*, `descripcion`, `stock`, `id_proveedor` |
| Empleados | `/api/empleados` | `nombre`, `apellido`, `cargo` | `nombre`*, `apellido`*, `cargo` |
| Compañías de envío | `/api/companias` | `nombre`, `telefono` | `nombre`*, `telefono` |
| Pedidos | `/api/pedidos` | `cliente`, `empleado`, `estado`, `desde`, `hasta` (fechas `YYYY-MM-DD`) | `id_cliente`*, `estado`, `total`, `id_empleado`, `id_compania` |

`*` = obligatorio.

Rutas especiales:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/ping` | Prueba la conexión a la BD con SQL puro (`$queryRaw`) |
| `GET` | `/api/pedidos/totales-por-cliente` | Cuánto gastó cada cliente (SUM + COUNT + GROUP BY) |
| `POST` | `/api/detalles` | Agrega un producto a un pedido. Body: `id_pedido`, `id_producto`, `cantidad`. El **precio y el subtotal los calcula el servidor** |
| `GET` | `/api/detalles/pedido/:id_pedido` | Detalles de un pedido (filtro opcional `?producto=1`) |
| `GET` | `/api/detalles/mas-vendidos` | Productos más vendidos (SUM + GROUP BY) |
| `PATCH` | `/api/detalles/:id` | Modifica una línea de detalle |
| `GET` | `/api/informe` | **[Consigna 3.4]** Informe general con SQL puro (`$queryRaw`): resumen global, top 5 clientes, stock bajo y rendimiento de empleados |

Estados válidos de un pedido: `pendiente`, `enviado`, `entregado`, `cancelado`.

---

## 6. Códigos de respuesta

La API **nunca** devuelve un stack trace ni SQL crudo. Los errores de base de datos se capturan en un manejador global (`src/middlewares/errorHandler.middleware.ts`):

| Código | Cuándo |
|---|---|
| `200` / `201` | Operación correcta / recurso creado |
| `400` | Faltan datos, id inválido (no numérico), valor no permitido, referencia a un ID que no existe, JSON mal formado |
| `404` | El registro no existe |
| `409` | Dato duplicado (DNI, CUIT, producto repetido en un pedido) o no se puede borrar porque tiene datos asociados |
| `500` | Error interno inesperado (mensaje genérico) |

---

## 7. Base de datos

Tablas: `clientes`, `companias_envio`, `empleados`, `proveedores`, `productos`, `pedidos`, `detalles_pedido`, `usuario`.

- **`database.sql` es la fuente de verdad** para recrear la base: incluye las restricciones `CHECK` (precio, stock y cantidad no negativos), que Prisma no puede representar en `schema.prisma`.
- Por eso **no** se recomienda crear la base con `prisma migrate`: no agregaría esos `CHECK` y los datos quedarían sin esas restricciones de integridad.
- Si alguna vez corrés `prisma migrate reset` también se perderían los `CHECK` — siempre reimportá `database.sql` para tener la BD completa.
- Si cambiás el `schema.prisma`, volvé a correr `npx prisma generate --config prisma7.config.ts`.

---

## 8. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Errores rojos `Cannot find module 'express'` / `'prisma/config'` / `'node'` en VS Code | Falta `npm install`. Después, `Ctrl+Shift+P` → **TypeScript: Restart TS Server** |
| `Falta la variable DATABASE_URL en el archivo .env` | Creá el `.env` (Paso 3) |
| `Cannot find module '../generated/prisma/client.js'` | Falta `npx prisma generate --config prisma7.config.ts` (Paso 5) |
| `ECONNREFUSED` / no conecta a la base | MySQL no está iniciado en XAMPP, o el puerto/usuario/contraseña del `.env` no coinciden |
| `Unknown database 'distribuidora_ipap'` | Falta importar `database.sql` (Paso 4) |
| `A folder called prisma already exists` | No corras `npx prisma init`: el proyecto ya tiene Prisma configurado |
| No actualices Prisma a `@latest` | Puede romper la configuración; el proyecto usa la 7.10.x |

---

## 9. Estado del TP5

- [x] Migración del proyecto a TypeScript
- [x] Modelado con Prisma (`schema.prisma`) y `database.sql`
- [x] Todos los endpoints migrados a Prisma ORM
- [x] Connection Pool configurado (`src/config/prisma.ts`)
- [x] Manejo global de errores con códigos HTTP semánticos
- [x] Ruta de informe con SQL puro (`$queryRaw`) – consigna 3.4 → `GET /api/informe`
- [x] Respuestas teóricas – consignas 3.1, 3.2 y 3.3 → `respuestas_teoricas.md`
- [x] Archivo `.json` con casos de prueba de todos los endpoints → `casos_de_prueba.json`
- [x] Esquema relacional en imagen en la raíz del proyecto → `estructura.png`

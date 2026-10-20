-- ============================================================
--  TP N° 4 - API REST: Distribuidora
--  Script para recrear la base de datos `distribuidora_ipap`
--
--  Incluye las 5 correcciones del profesor.
--  Buscá por "CORRECCION" para encontrar cada una:
--    CORRECCION 1: CREATE DATABASE + USE (el script se ejecuta solo)
--    CORRECCION 2: precio_unitario histórico en detalles_pedido
--    CORRECCION 3: UNIQUE (id_pedido, id_producto)
--    CORRECCION 4: estado del pedido (ENUM)
--    CORRECCION 5: CHECK contra precios / stock / cantidad negativos
-- ============================================================

-- [CORRECCION 1] El script debe crear y seleccionar la base de datos,
-- así quien lo importa no necesita crearla a mano antes.
CREATE DATABASE IF NOT EXISTS `distribuidora_ipap`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE `distribuidora_ipap`;

-- Se eliminan las tablas en orden inverso a sus dependencias
-- para poder re-ejecutar el script sin errores (DROP + CREATE)
DROP TABLE IF EXISTS `usuario`;   -- [TP5] tabla agregada con Prisma
DROP TABLE IF EXISTS `detalles_pedido`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `proveedores`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `empleados`;
DROP TABLE IF EXISTS `companias_envio`;

-- ------------------------------------------------------------
-- clientes
-- ------------------------------------------------------------
CREATE TABLE `clientes` (
    `id_cliente` INT(11) NOT NULL AUTO_INCREMENT,
    `nombre`     VARCHAR(50) NOT NULL,
    `apellido`   VARCHAR(50) NOT NULL,
    `dni`        VARCHAR(15) NOT NULL,
    `direccion`  VARCHAR(150) DEFAULT NULL,
    `telefono`   VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (`id_cliente`),
    UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- companias_envio
-- ------------------------------------------------------------
CREATE TABLE `companias_envio` (
    `id_compania` INT(11) NOT NULL AUTO_INCREMENT,
    `nombre`      VARCHAR(100) NOT NULL,
    `telefono`    VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (`id_compania`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- empleados
-- ------------------------------------------------------------
CREATE TABLE `empleados` (
    `id_empleado` INT(11) NOT NULL AUTO_INCREMENT,
    `nombre`      VARCHAR(50) NOT NULL,
    `apellido`    VARCHAR(50) NOT NULL,
    `cargo`       VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (`id_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- proveedores
-- ------------------------------------------------------------
CREATE TABLE `proveedores` (
    `id_proveedor` INT(11) NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(100) NOT NULL,
    `cuit`         VARCHAR(15) NOT NULL,
    `telefono`     VARCHAR(20) DEFAULT NULL,
    `email`        VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (`id_proveedor`),
    UNIQUE KEY `cuit` (`cuit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- productos
-- ------------------------------------------------------------
CREATE TABLE `productos` (
    `id_producto`    INT(11) NOT NULL AUTO_INCREMENT,
    `nombre`         VARCHAR(100) NOT NULL,
    `descripcion`    TEXT DEFAULT NULL,
    -- [CORRECCION 5] No se permite cargar un producto con precio negativo
    `precio_unitario` DECIMAL(10,2) NOT NULL CHECK (`precio_unitario` >= 0),
    -- [CORRECCION 5] No se permite bajar el stock por debajo de 0
    `stock`          INT(11) NOT NULL DEFAULT 0 CHECK (`stock` >= 0),
    `id_proveedor`   INT(11) DEFAULT NULL,
    PRIMARY KEY (`id_producto`),
    CONSTRAINT `fk_productos_proveedor`
        FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- pedidos
-- ------------------------------------------------------------
CREATE TABLE `pedidos` (
    `id_pedido`   INT(11) NOT NULL AUTO_INCREMENT,
    `fecha`       DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- [CORRECCION 5] El total de un pedido tampoco puede ser negativo
    `total`       DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (`total` >= 0),
    -- [CORRECCION 4] Estado del pedido: si no se indica, nace 'pendiente'.
    -- (El profesor menciona también 'cancelado', así que incluimos los 4 valores)
    `estado`      ENUM('pendiente','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
    `id_cliente`  INT(11) DEFAULT NULL,
    `id_empleado` INT(11) DEFAULT NULL,
    `id_compania` INT(11) DEFAULT NULL,
    PRIMARY KEY (`id_pedido`),
    CONSTRAINT `fk_pedidos_cliente`
        FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pedidos_empleado`
        FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pedidos_compania`
        FOREIGN KEY (`id_compania`) REFERENCES `companias_envio` (`id_compania`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- detalles_pedido
-- ------------------------------------------------------------
CREATE TABLE `detalles_pedido` (
    `id_detalle`     INT(11) NOT NULL AUTO_INCREMENT,
    `id_pedido`      INT(11) DEFAULT NULL,
    `id_producto`    INT(11) DEFAULT NULL,
    -- [CORRECCION 5] La cantidad debe ser al menos 1
    `cantidad`       INT(11) NOT NULL CHECK (`cantidad` > 0),
    -- [CORRECCION 2] Precio HISTÓRICO: se guarda el precio vigente del producto
    -- al momento de la venta. Si mañana el producto sube de precio, este campo
    -- sigue diciendo a cuánto se vendió (no hay que dividir subtotal / cantidad).
    -- Lo completa el servidor en el controller, nunca el cliente.
    `precio_unitario` DECIMAL(10,2) NOT NULL CHECK (`precio_unitario` >= 0),
    -- [CORRECCION 5] El subtotal tampoco puede quedar negativo
    `subtotal`       DECIMAL(10,2) NOT NULL CHECK (`subtotal` >= 0),
    PRIMARY KEY (`id_detalle`),
    -- [CORRECCION 3] Un mismo producto no puede figurar dos veces en el mismo
    -- pedido: el cajero debe sumar cantidades en una sola línea. Si se intenta,
    -- MySQL responde ERROR 1062 y la API contesta 409.
    UNIQUE KEY `pedido_producto` (`id_pedido`, `id_producto`),
    CONSTRAINT `fk_detalles_pedido`
        FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_detalles_producto`
        FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- usuario  [TP5] tabla agregada al modelado con Prisma (consigna 1.3)
-- ------------------------------------------------------------
CREATE TABLE `usuario` (
    `id_usuario` INT(11) NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(50) NOT NULL,
    `password`   VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `usuario_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Datos de ejemplo
-- ============================================================
INSERT INTO `clientes` (`nombre`, `apellido`, `dni`, `direccion`, `telefono`)
VALUES ('Juan Carlos', 'Del Castillo', '30123456', 'San Carlos de Bariloche', '2944-123456');

-- [TP5] Más clientes (el 3 no tiene teléfono, para probar COUNT(telefono))
INSERT INTO `clientes` (`nombre`, `apellido`, `dni`, `direccion`, `telefono`) VALUES
('María Laura', 'Fernández', '28456789', 'Mitre 450, Bariloche',         '2944-556677'),
('Roberto',     'Sosa',      '25987654', 'Av. Bustillo km 5, Bariloche', NULL),
('Lucía',       'Mendoza',   '35111222', 'Elflein 120, Bariloche',       '2944-889900'),
('Pedro',       'Almonacid', '27333444', 'Ruta 40 km 2, El Bolsón',      '2944-112233');

INSERT INTO `companias_envio` (`nombre`, `telefono`)
VALUES ('Andreani Logística', '0810-122-1122');

-- [TP5] Más compañías de envío
INSERT INTO `companias_envio` (`nombre`, `telefono`) VALUES
('OCA Logística',    '0810-999-0622'),
('Correo Argentino', '0800-222-3639');

INSERT INTO `empleados` (`nombre`, `apellido`, `cargo`)
VALUES ('Carlos', 'Giménez', 'Supervisor de Logística');

-- [TP5] Más empleados
INSERT INTO `empleados` (`nombre`, `apellido`, `cargo`) VALUES
('Ana',    'Beltrán', 'Vendedora'),
('Martín', 'Quiroga', 'Repartidor');

INSERT INTO `proveedores` (`razon_social`, `cuit`, `telefono`, `email`)
VALUES ('Mayorista Bariloche SRL', '30-87654321-0', '2944-654321', 'contacto@mayoristabrc.com'),
       ('Mayorista Bolsón SRL',    '30-87654541-0', '2944-674321', 'contactobol@mayoristaeb.com');

-- [TP5] Más proveedores
INSERT INTO `proveedores` (`razon_social`, `cuit`, `telefono`, `email`) VALUES
('Distribuidora Patagonia SA', '30-70123456-5', '2944-700123', 'ventas@distpatagonia.com'),
('Alimentos del Sur SRL',      '30-71234567-8', '2944-712345', 'info@alimentosdelsur.com');

INSERT INTO `productos` (`nombre`, `descripcion`, `precio_unitario`, `stock`, `id_proveedor`)
VALUES ('Coca Cola 2.25L', 'Gaseosa sabor cola envase retornable', 2500.50, 100, 2);

-- [TP5] Más productos (el aceite tiene stock bajo a propósito)
INSERT INTO `productos` (`nombre`, `descripcion`, `precio_unitario`, `stock`, `id_proveedor`) VALUES
('Sprite 2.25L',            'Gaseosa lima limón',                 2450.00,  80, 2),
('Agua Mineral 2L',         'Agua mineral sin gas',               1200.00, 150, 1),
('Cerveza Quilmes 1L',      'Cerveza rubia retornable',           2100.00, 120, 3),
('Fideos Spaghetti 500g',   'Fideos secos de trigo candeal',      1350.75, 200, 1),
('Aceite de Girasol 900ml', 'Aceite de girasol botella plástica', 3200.00,   8, 4),
('Yerba Mate 1kg',          'Yerba mate con palo',                5400.00,  90, 1),
('Galletitas de Agua 300g', 'Galletitas de agua clásicas',        1800.25,  25, 4);

-- [TP5] El total del pedido 1 se corrigió a 8601.00: es la suma de sus dos
-- detalles (5001.00 + 3600.00). Antes decía 15500.50 y no coincidía con nada.
INSERT INTO `pedidos` (`total`, `estado`, `id_cliente`, `id_empleado`, `id_compania`)
VALUES (8601.00, 'entregado', 1, 1, 1);

-- [TP5] Más pedidos, con fecha explícita para poder probar los filtros por fecha
INSERT INTO `pedidos` (`fecha`, `total`, `estado`, `id_cliente`, `id_empleado`, `id_compania`) VALUES
('2026-09-15 11:30:00', 17904.50, 'enviado',   2, 2, 2),
('2026-09-28 09:45:00', 20400.00, 'pendiente', 3, 2, 1),
('2026-10-05 16:20:00', 14500.50, 'entregado', 1, 3, 3),
('2026-10-08 12:00:00', 18002.50, 'cancelado', 4, 1, 2),
('2026-10-14 15:10:00', 28200.00, 'enviado',   5, 3, 3);

-- [CORRECCION 2] Precio histórico: al momento de la venta valía 2500.50.
-- (Si mañana el producto pasa a 3000.00, este detalle seguirá diciendo 2500.50)
INSERT INTO `detalles_pedido` (`id_pedido`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`)
VALUES (1, 1, 2, 2500.50, 5001.00);   -- [TP5] subtotal corregido: 2 x 2500.50 = 5001.00 (decía 5000.00)

-- [TP5] Más detalles. Cada pedido suma exactamente lo que dice su total.
INSERT INTO `detalles_pedido` (`id_pedido`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
-- Pedido 1 (completa el 8601.00)
(1, 3,  3, 1200.00,  3600.00),
-- Pedido 2: 9800.00 + 8104.50 = 17904.50
(2, 2,  4, 2450.00,  9800.00),
(2, 5,  6, 1350.75,  8104.50),
-- Pedido 3: 10800.00 + 9600.00 = 20400.00
(3, 7,  2, 5400.00, 10800.00),
(3, 6,  3, 3200.00,  9600.00),
-- Pedido 4: 12000.00 + 2500.50 = 14500.50
-- [CORRECCION 2] La cerveza se vendió a 2000.00 y hoy el producto vale 2100.00:
-- el detalle conserva el precio histórico.
(4, 4,  6, 2000.00, 12000.00),
(4, 1,  1, 2500.50,  2500.50),
-- Pedido 5 (cancelado): 18002.50
(5, 8, 10, 1800.25, 18002.50),
-- Pedido 6: 14400.00 + 8400.00 + 5400.00 = 28200.00
(6, 3, 12, 1200.00, 14400.00),
(6, 4,  4, 2100.00,  8400.00),
(6, 7,  1, 5400.00,  5400.00);

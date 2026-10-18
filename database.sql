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

-- ============================================================
--  Datos de ejemplo
-- ============================================================
INSERT INTO `clientes` (`nombre`, `apellido`, `dni`, `direccion`, `telefono`)
VALUES ('Juan Carlos', 'Del Castillo', '30123456', 'San Carlos de Bariloche', '2944-123456');

INSERT INTO `companias_envio` (`nombre`, `telefono`)
VALUES ('Andreani Logística', '0810-122-1122');

INSERT INTO `empleados` (`nombre`, `apellido`, `cargo`)
VALUES ('Carlos', 'Giménez', 'Supervisor de Logística');

INSERT INTO `proveedores` (`razon_social`, `cuit`, `telefono`, `email`)
VALUES ('Mayorista Bariloche SRL', '30-87654321-0', '2944-654321', 'contacto@mayoristabrc.com'),
       ('Mayorista Bolsón SRL',    '30-87654541-0', '2944-674321', 'contactobol@mayoristaeb.com');

INSERT INTO `productos` (`nombre`, `descripcion`, `precio_unitario`, `stock`, `id_proveedor`)
VALUES ('Coca Cola 2.25L', 'Gaseosa sabor cola envase retornable', 2500.50, 100, 2);

INSERT INTO `pedidos` (`total`, `estado`, `id_cliente`, `id_empleado`, `id_compania`)
VALUES (15500.50, 'entregado', 1, 1, 1);

-- [CORRECCION 2] Precio histórico: al momento de la venta valía 2500.50.
-- (Si mañana el producto pasa a 3000.00, este detalle seguirá diciendo 2500.50)
INSERT INTO `detalles_pedido` (`id_pedido`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`)
VALUES (1, 1, 2, 2500.50, 5000.00);

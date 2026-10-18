-- CreateTable
CREATE TABLE `clientes` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `apellido` VARCHAR(50) NOT NULL,
    `dni` VARCHAR(15) NOT NULL,
    `direccion` VARCHAR(150) NULL,
    `telefono` VARCHAR(20) NULL,

    UNIQUE INDEX `dni`(`dni`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companias_envio` (
    `id_compania` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,

    PRIMARY KEY (`id_compania`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_pedido` (
    `id_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NULL,
    `id_producto` INTEGER NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_detalles_producto`(`id_producto`),
    UNIQUE INDEX `pedido_producto`(`id_pedido`, `id_producto`),
    PRIMARY KEY (`id_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id_empleado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `apellido` VARCHAR(50) NOT NULL,
    `cargo` VARCHAR(50) NULL,

    PRIMARY KEY (`id_empleado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id_pedido` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `estado` ENUM('pendiente', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    `id_cliente` INTEGER NULL,
    `id_empleado` INTEGER NULL,
    `id_compania` INTEGER NULL,

    INDEX `fk_pedidos_cliente`(`id_cliente`),
    INDEX `fk_pedidos_compania`(`id_compania`),
    INDEX `fk_pedidos_empleado`(`id_empleado`),
    PRIMARY KEY (`id_pedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `id_proveedor` INTEGER NULL,

    INDEX `fk_productos_proveedor`(`id_proveedor`),
    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedores` (
    `id_proveedor` INTEGER NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(100) NOT NULL,
    `cuit` VARCHAR(15) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,

    UNIQUE INDEX `cuit`(`cuit`),
    PRIMARY KEY (`id_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `detalles_pedido` ADD CONSTRAINT `fk_detalles_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_pedido` ADD CONSTRAINT `fk_detalles_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_compania` FOREIGN KEY (`id_compania`) REFERENCES `companias_envio`(`id_compania`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleados`(`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE SET NULL ON UPDATE CASCADE;

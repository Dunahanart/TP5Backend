-- =====================================================================
--  TP5 - Observaciones del profesor
--    1) Clave compuesta (id_pedido, id_producto) en detalles_pedido:
--       se elimina el id_detalle autogenerado que no aportaba nada.
--    2) Auditoría: created_at + updated_at en todas las tablas del negocio.
--    3) Soft delete en empleados (activo) para no borrar quien ya vendió.
--    4) FK a RESTRICT: no se borra proveedor / compañía / empleado referenciado.
--    5) El total del pedido lo recalcula el servidor (SUM(subtotal) de detalles).
--
--  Nota: las columnas de auditoría se agregan con DEFAULT y ON UPDATE, así
--  la BD las completa aunque alguien escriba SQL a mano (defensa en profundidad
--  junto a los @default(now()) / @updatedAt del schema de Prisma).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Auditoría en las tablas del negocio
-- ---------------------------------------------------------------------
ALTER TABLE `clientes`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `companias_envio`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `empleados`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `proveedores`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `productos`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `pedidos`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `detalles_pedido`
    ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------
-- 2) Soft delete en empleados: no se borra a quien ya hizo ventas,
--    se desactiva. La API filtra por activo = 1 en todos los GET.
-- ---------------------------------------------------------------------
ALTER TABLE `empleados`
    ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------
-- 3) Clave compuesta en detalles_pedido.
--    Primero se sueltan las FKs viejas, después se cambia la PK
--    (orden IMPORTANTE en MySQL / MariaDB).
-- ---------------------------------------------------------------------
-- Al re-crear una FK con el mismo nombre, InnoDB intenta generar un índice con ese
-- nombre; si ya existe tira ERROR 105. Por eso se suelta el índice a la vez que la
-- FK y se vuelve a crear junto con la constraint (orden comprobado en MariaDB 10.4).
ALTER TABLE `detalles_pedido`
    DROP FOREIGN KEY `fk_detalles_pedido`,
    DROP FOREIGN KEY `fk_detalles_producto`,
    DROP INDEX `fk_detalles_producto`;

ALTER TABLE `detalles_pedido`
    DROP PRIMARY KEY,
    DROP INDEX `pedido_producto`,
    DROP COLUMN `id_detalle`,
    MODIFY `id_pedido` INT(11) NOT NULL,
    MODIFY `id_producto` INT(11) NOT NULL,
    ADD PRIMARY KEY (`id_pedido`, `id_producto`),
    ADD INDEX `fk_detalles_producto` (`id_producto`);

-- Se vuelven a crear las FKs (mismo comportamiento que antes):
--   pedido  -> CASCADE (si se borra el pedido, desaparecen sus detalles)
--   producto -> RESTRICT (no se borra un producto que ya se vendió)
ALTER TABLE `detalles_pedido`
    ADD CONSTRAINT `fk_detalles_pedido`
        FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_detalles_producto`
        FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
        ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 4) FK a RESTRICT en producto -> proveedor, pedido -> empleado y
--    pedido -> compañía de envío. Antes eran SET NULL y borraban datos
--    de referencia sin avisar; la API ahora responde 409.
-- ---------------------------------------------------------------------
ALTER TABLE `productos`
    DROP FOREIGN KEY `fk_productos_proveedor`,
    DROP INDEX `fk_productos_proveedor`;

ALTER TABLE `productos`
    ADD INDEX `fk_productos_proveedor` (`id_proveedor`),
    ADD CONSTRAINT `fk_productos_proveedor`
        FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
        ON UPDATE CASCADE;

ALTER TABLE `pedidos`
    DROP FOREIGN KEY `fk_pedidos_empleado`,
    DROP INDEX `fk_pedidos_empleado`;

ALTER TABLE `pedidos`
    ADD INDEX `fk_pedidos_empleado` (`id_empleado`),
    ADD CONSTRAINT `fk_pedidos_empleado`
        FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`)
        ON UPDATE CASCADE;

ALTER TABLE `pedidos`
    DROP FOREIGN KEY `fk_pedidos_compania`,
    DROP INDEX `fk_pedidos_compania`;

ALTER TABLE `pedidos`
    ADD INDEX `fk_pedidos_compania` (`id_compania`),
    ADD CONSTRAINT `fk_pedidos_compania`
        FOREIGN KEY (`id_compania`) REFERENCES `companias_envio` (`id_compania`)
        ON UPDATE CASCADE;

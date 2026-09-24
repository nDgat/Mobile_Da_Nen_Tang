CREATE TABLE `Voucher` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(500) NULL,
  `discountType` ENUM('FIXED', 'PERCENTAGE') NOT NULL,
  `discountValue` DECIMAL(12, 0) NOT NULL,
  `minOrderAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
  `maxDiscountAmount` DECIMAL(12, 0) NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  `usageLimit` INTEGER NULL,
  `usedCount` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Voucher_code_key`(`code`),
  INDEX `Voucher_isActive_startsAt_endsAt_idx`(`isActive`, `startsAt`, `endsAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Booking`
  ADD COLUMN `voucherId` INTEGER NULL,
  ADD COLUMN `voucherCode` VARCHAR(50) NULL,
  ADD INDEX `Booking_voucherId_idx`(`voucherId`),
  ADD CONSTRAINT `Booking_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

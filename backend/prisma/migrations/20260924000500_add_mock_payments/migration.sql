CREATE TABLE `Payment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(36) NOT NULL,
  `bookingId` INTEGER NOT NULL,
  `provider` VARCHAR(30) NOT NULL DEFAULT 'MOCK',
  `amount` DECIMAL(12, 0) NOT NULL,
  `status` ENUM('SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL,
  `failureReason` VARCHAR(255) NULL,
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Payment_code_key`(`code`),
  INDEX `Payment_bookingId_createdAt_idx`(`bookingId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Payment`
  ADD CONSTRAINT `Payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

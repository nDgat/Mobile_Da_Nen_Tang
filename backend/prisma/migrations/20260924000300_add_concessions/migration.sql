CREATE TABLE `ConcessionProduct` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(500) NULL,
  `category` ENUM('POPCORN', 'DRINK', 'COMBO') NOT NULL,
  `price` DECIMAL(12, 0) NOT NULL,
  `imageUrl` VARCHAR(2048) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ConcessionProduct_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BookingConcessionItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `bookingId` INTEGER NOT NULL,
  `productId` INTEGER NOT NULL,
  `productName` VARCHAR(150) NOT NULL,
  `unitPrice` DECIMAL(12, 0) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `lineTotal` DECIMAL(12, 0) NOT NULL,
  INDEX `BookingConcessionItem_productId_idx`(`productId`),
  UNIQUE INDEX `BookingConcessionItem_bookingId_productId_key`(`bookingId`, `productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BookingConcessionItem`
  ADD CONSTRAINT `BookingConcessionItem_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `BookingConcessionItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `ConcessionProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

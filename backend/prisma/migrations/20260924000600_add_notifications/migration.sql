CREATE TABLE `Notification` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `bookingId` INTEGER NULL,
  `type` ENUM('BOOKING_CONFIRMED', 'SHOWTIME_REMINDER', 'SYSTEM') NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `body` VARCHAR(500) NOT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Notification_userId_isRead_createdAt_idx`(`userId`, `isRead`, `createdAt`),
  INDEX `Notification_bookingId_idx`(`bookingId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

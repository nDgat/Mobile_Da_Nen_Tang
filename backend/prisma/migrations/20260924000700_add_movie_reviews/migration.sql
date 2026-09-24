CREATE TABLE `MovieReview` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `movieId` INTEGER NOT NULL,
  `rating` INTEGER NOT NULL,
  `comment` VARCHAR(1000) NULL,
  `isVisible` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `MovieReview_userId_movieId_key`(`userId`, `movieId`),
  INDEX `MovieReview_movieId_isVisible_createdAt_idx`(`movieId`, `isVisible`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MovieReview`
  ADD CONSTRAINT `MovieReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `MovieReview_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `Movie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `HomeContentItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `section` ENUM('BANNER', 'HOT_NEWS', 'VOUCHER', 'PARTNER_PROMOTION') NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `subtitle` VARCHAR(500) NULL,
  `imageUrl` VARCHAR(2048) NULL,
  `linkUrl` VARCHAR(2048) NULL,
  `badge` VARCHAR(60) NULL,
  `displayStyle` ENUM('HERO', 'CARD', 'SQUARE') NOT NULL DEFAULT 'CARD',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `HomeContentItem_section_isActive_sortOrder_idx`(`section`, `isActive`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

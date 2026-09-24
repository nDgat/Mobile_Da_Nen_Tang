CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `actorId` INTEGER NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(100) NOT NULL,
  `beforeData` JSON NULL,
  `afterData` JSON NULL,
  `requestId` VARCHAR(100) NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
  INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
  INDEX `AuditLog_action_createdAt_idx`(`action`, `createdAt`),
  INDEX `AuditLog_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

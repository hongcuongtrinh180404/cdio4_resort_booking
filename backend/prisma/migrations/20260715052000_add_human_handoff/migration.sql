-- AlterTable ChatConversation: add human handoff fields
ALTER TABLE `ChatConversation` ADD COLUMN `supportRequested` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `ChatConversation` ADD COLUMN `staffId` INTEGER NULL;
ALTER TABLE `ChatConversation` ADD COLUMN `aiPausedUntil` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `ChatConversation_staffId_idx` ON `ChatConversation`(`staffId`);

-- AddForeignKey
ALTER TABLE `ChatConversation` ADD CONSTRAINT `ChatConversation_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

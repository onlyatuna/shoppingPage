-- AlterTable: Add AI Blend quota fields to users table
ALTER TABLE `users` ADD COLUMN `aiBlendLastResetDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `aiBlendUsageCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isPremium` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add index for stat queries
CREATE INDEX `users_aiBlendLastResetDate_idx` ON `users`(`aiBlendLastResetDate`);

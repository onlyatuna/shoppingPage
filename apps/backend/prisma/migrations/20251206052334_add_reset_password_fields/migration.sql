/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL,
    ADD COLUMN `resetPasswordTokenExpiresAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_resetPasswordToken_key` ON `users`(`resetPasswordToken`);

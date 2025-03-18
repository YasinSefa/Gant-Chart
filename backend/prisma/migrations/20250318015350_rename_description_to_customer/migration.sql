/*
  Warnings:

  - You are about to drop the column `description` on the `WorkOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "description",
ADD COLUMN     "customer" TEXT;

/*
  Warnings:

  - You are about to drop the column `description` on the `BusinessPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BusinessPlan" DROP COLUMN "description",
ALTER COLUMN "content" SET DEFAULT '{}';

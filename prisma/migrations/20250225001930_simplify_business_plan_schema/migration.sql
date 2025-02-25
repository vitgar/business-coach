/*
  Warnings:

  - You are about to drop the column `attachments` on the `BusinessPlan` table. All the data in the column will be lost.
  - You are about to drop the `BusinessDescription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BusinessMarketingPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExecutiveSummary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OperatingPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RiskManagement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessDescription" DROP CONSTRAINT "BusinessDescription_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessMarketingPlan" DROP CONSTRAINT "BusinessMarketingPlan_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "ExecutiveSummary" DROP CONSTRAINT "ExecutiveSummary_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialPlan" DROP CONSTRAINT "FinancialPlan_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "OperatingPlan" DROP CONSTRAINT "OperatingPlan_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "RiskManagement" DROP CONSTRAINT "RiskManagement_businessPlanId_fkey";

-- AlterTable
ALTER TABLE "BusinessPlan" DROP COLUMN "attachments";

-- DropTable
DROP TABLE "BusinessDescription";

-- DropTable
DROP TABLE "BusinessMarketingPlan";

-- DropTable
DROP TABLE "ExecutiveSummary";

-- DropTable
DROP TABLE "FinancialPlan";

-- DropTable
DROP TABLE "OperatingPlan";

-- DropTable
DROP TABLE "RiskManagement";

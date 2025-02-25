-- AlterTable
ALTER TABLE "BusinessPlan" ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ExecutiveSummary" (
    "id" TEXT NOT NULL,
    "visionAndGoals" TEXT NOT NULL,
    "productsOrServices" TEXT NOT NULL,
    "targetMarket" TEXT NOT NULL,
    "distributionStrategy" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "ExecutiveSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDescription" (
    "id" TEXT NOT NULL,
    "nameAndAddress" TEXT NOT NULL,
    "dateFounded" TEXT NOT NULL,
    "founders" TEXT NOT NULL,
    "ownershipStructure" TEXT NOT NULL,
    "missionStatement" TEXT NOT NULL,
    "keyManagement" TEXT[],
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "BusinessDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMarketingPlan" (
    "id" TEXT NOT NULL,
    "productDifferentiation" TEXT NOT NULL,
    "industryProfile" TEXT NOT NULL,
    "competitiveAnalysis" TEXT NOT NULL,
    "targetMarketDetails" TEXT NOT NULL,
    "marketingStrategy" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "BusinessMarketingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingPlan" (
    "id" TEXT NOT NULL,
    "personnel" TEXT NOT NULL,
    "productionMethods" TEXT NOT NULL,
    "qualityControl" TEXT NOT NULL,
    "facilitiesAndEquipment" TEXT NOT NULL,
    "suppliers" TEXT NOT NULL,
    "billingAndCollections" TEXT NOT NULL,
    "recordkeeping" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "OperatingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPlan" (
    "id" TEXT NOT NULL,
    "financialStatements" TEXT NOT NULL,
    "pricingStrategy" TEXT NOT NULL,
    "breakEvenAnalysis" TEXT NOT NULL,
    "cashFlowProjections" TEXT NOT NULL,
    "forecastingAssumptions" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "FinancialPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskManagement" (
    "id" TEXT NOT NULL,
    "keyRisks" TEXT NOT NULL,
    "contingencyPlans" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,

    CONSTRAINT "RiskManagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveSummary_businessPlanId_key" ON "ExecutiveSummary"("businessPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDescription_businessPlanId_key" ON "BusinessDescription"("businessPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMarketingPlan_businessPlanId_key" ON "BusinessMarketingPlan"("businessPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingPlan_businessPlanId_key" ON "OperatingPlan"("businessPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPlan_businessPlanId_key" ON "FinancialPlan"("businessPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskManagement_businessPlanId_key" ON "RiskManagement"("businessPlanId");

-- AddForeignKey
ALTER TABLE "ExecutiveSummary" ADD CONSTRAINT "ExecutiveSummary_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDescription" ADD CONSTRAINT "BusinessDescription_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMarketingPlan" ADD CONSTRAINT "BusinessMarketingPlan_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingPlan" ADD CONSTRAINT "OperatingPlan_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPlan" ADD CONSTRAINT "FinancialPlan_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskManagement" ADD CONSTRAINT "RiskManagement_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

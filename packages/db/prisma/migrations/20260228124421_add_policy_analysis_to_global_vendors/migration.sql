-- AlterTable
ALTER TABLE "GlobalVendors" ADD COLUMN     "policyAnalysisData" JSONB,
ADD COLUMN     "policyAnalysisUpdatedAt" TIMESTAMP(3);

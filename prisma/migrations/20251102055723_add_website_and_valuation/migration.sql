-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('automated_outreach', 'dealer_outreach', 'pitch_meeting_planned', 'proposal_sent', 'mandate_signed', 'deal_material_creation', 'buyer_reachouts', 'deal_negotiations', 'deal_closed', 'deal_lost', 're_engage_later');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('SaaS', 'E_commerce', 'Manufacturing', 'Healthcare', 'Fintech', 'Food_Beverage', 'Professional_Services', 'Technology', 'Logistics', 'Real_Estate');

-- CreateTable
CREATE TABLE "bankers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bankers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "Industry" NOT NULL,
    "revenue" INTEGER NOT NULL,
    "ebitda" INTEGER NOT NULL,
    "headcount" INTEGER NOT NULL,
    "geography" TEXT NOT NULL,
    "dealStage" "DealStage" NOT NULL,
    "ownerBankerId" TEXT NOT NULL,
    "lastContactDate" TIMESTAMP(3) NOT NULL,
    "estimatedDealSize" INTEGER NOT NULL,
    "likelihoodToSell" INTEGER NOT NULL,
    "website" TEXT,
    "valuation" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_companies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "seller_companies" ADD CONSTRAINT "seller_companies_ownerBankerId_fkey" FOREIGN KEY ("ownerBankerId") REFERENCES "bankers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

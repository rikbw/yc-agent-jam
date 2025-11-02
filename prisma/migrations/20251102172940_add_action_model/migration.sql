-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('call');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'completed');

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "seller_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('productive', 'no_answer', 'voicemail', 'scheduled_meeting', 'not_interested');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('assistant', 'user', 'system');

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "bankerId" TEXT NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "outcome" "CallOutcome",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "transcript" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "seller_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_bankerId_fkey" FOREIGN KEY ("bankerId") REFERENCES "bankers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "OAuthService" AS ENUM ('gmail', 'google_calendar');

-- CreateEnum
CREATE TYPE "OAuthStatus" AS ENUM ('pending', 'active', 'expired');

-- CreateTable
CREATE TABLE "oauth_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "service" "OAuthService" NOT NULL,
    "serverDeploymentId" TEXT NOT NULL,
    "oauthSessionId" TEXT NOT NULL,
    "status" "OAuthStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_sessions_sessionId_key" ON "oauth_sessions"("sessionId");

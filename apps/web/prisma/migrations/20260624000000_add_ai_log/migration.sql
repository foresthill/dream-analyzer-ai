-- CreateEnum
CREATE TYPE "AiLogOperation" AS ENUM ('ANALYZE', 'CHAT');

-- CreateEnum
CREATE TYPE "AiLogStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dreamId" TEXT,
    "analysisId" TEXT,
    "operation" "AiLogOperation" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "status" "AiLogStatus" NOT NULL,
    "errorMessage" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiLog_userId_createdAt_idx" ON "AiLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiLog_operation_idx" ON "AiLog"("operation");

-- CreateIndex
CREATE INDEX "AiLog_status_idx" ON "AiLog"("status");

-- CreateIndex
CREATE INDEX "AiLog_dreamId_idx" ON "AiLog"("dreamId");

-- CreateIndex
CREATE INDEX "AiLog_analysisId_idx" ON "AiLog"("analysisId");

-- AddForeignKey
ALTER TABLE "AiLog" ADD CONSTRAINT "AiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

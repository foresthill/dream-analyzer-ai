-- CreateEnum
CREATE TYPE "DreamMood" AS ENUM ('JOYFUL', 'PEACEFUL', 'ANXIOUS', 'FEARFUL', 'SAD', 'ANGRY', 'CONFUSED', 'EXCITED', 'NEUTRAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mood" "DreamMood" NOT NULL,
    "lucidity" INTEGER NOT NULL DEFAULT 5,
    "vividness" INTEGER NOT NULL DEFAULT 5,
    "emotionalIntensity" INTEGER NOT NULL DEFAULT 5,
    "setting" TEXT,
    "characters" TEXT[],
    "emotions" TEXT[],
    "colors" TEXT[],
    "sleepQuality" INTEGER,
    "bedTime" TIMESTAMP(3),
    "wakeTime" TIMESTAMP(3),
    "tags" TEXT[],
    "analyzed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamAnalysis" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "psychologicalInterpretation" TEXT NOT NULL,
    "symbols" JSONB NOT NULL,
    "themes" TEXT[],
    "emotionalAnalysis" JSONB NOT NULL,
    "underlyingMeanings" TEXT[],
    "insights" TEXT[],
    "relatedDreams" TEXT[],
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DreamAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Dream_userId_date_idx" ON "Dream"("userId", "date");

-- CreateIndex
CREATE INDEX "Dream_date_idx" ON "Dream"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DreamAnalysis_dreamId_key" ON "DreamAnalysis"("dreamId");

-- CreateIndex
CREATE INDEX "DreamAnalysis_dreamId_idx" ON "DreamAnalysis"("dreamId");

-- CreateIndex
CREATE INDEX "DreamAnalysis_provider_idx" ON "DreamAnalysis"("provider");

-- CreateIndex
CREATE INDEX "DreamAnalysis_model_idx" ON "DreamAnalysis"("model");

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamAnalysis" ADD CONSTRAINT "DreamAnalysis_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

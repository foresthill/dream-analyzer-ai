/*
  Warnings:

  - A unique constraint covering the columns `[dreamId,provider,model]` on the table `DreamAnalysis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dreamerId` to the `Dream` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DreamAnalysis_dreamId_key";

-- AlterTable
ALTER TABLE "Dream" ADD COLUMN     "dreamerId" TEXT;

-- CreateTable
CREATE TABLE "Dreamer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dreamer_pkey" PRIMARY KEY ("id")
);



-- CreateIndex
CREATE INDEX "Dreamer_userId_idx" ON "Dreamer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dreamer_userId_name_key" ON "Dreamer"("userId", "name");

-- CreateIndex
CREATE INDEX "Dream_dreamerId_date_idx" ON "Dream"("dreamerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DreamAnalysis_dreamId_provider_model_key" ON "DreamAnalysis"("dreamId", "provider", "model");

-- AddForeignKey
ALTER TABLE "Dreamer" ADD CONSTRAINT "Dreamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_dreamerId_fkey" FOREIGN KEY ("dreamerId") REFERENCES "Dreamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[dreamId,provider,model]` on the table `DreamAnalysis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dreamerId` to the `Dream` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable: Dreamer
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
CREATE UNIQUE INDEX "Dreamer_userId_name_key" ON "Dreamer"("userId", "name");

-- AddForeignKey
ALTER TABLE "Dreamer" ADD CONSTRAINT "Dreamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default-user first
INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt")
VALUES ('default-user', 'default@example.com', 'Default User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert default-dreamer
INSERT INTO "Dreamer" ("id", "userId", "name", "relationship", "createdAt", "updatedAt")
VALUES ('default-dreamer', 'default-user', '自分', '本人', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Add dreamerId column (nullable first)
ALTER TABLE "Dream" ADD COLUMN "dreamerId" TEXT;

-- Update existing dreams
UPDATE "Dream" SET "dreamerId" = 'default-dreamer' WHERE "dreamerId" IS NULL;

-- Make dreamerId required
ALTER TABLE "Dream" ALTER COLUMN "dreamerId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Dream_dreamerId_date_idx" ON "Dream"("dreamerId", "date");

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_dreamerId_fkey" FOREIGN KEY ("dreamerId") REFERENCES "Dreamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex (if exists) ← ここを修正
DROP INDEX IF EXISTS "DreamAnalysis_dreamId_key";

-- CreateIndex
CREATE UNIQUE INDEX "DreamAnalysis_dreamId_provider_model_key" ON "DreamAnalysis"("dreamId", "provider", "model");


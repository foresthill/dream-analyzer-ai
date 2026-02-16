-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('EMAIL', 'LINK');

-- CreateTable
CREATE TABLE "DreamShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "dreamId" TEXT,
    "dreamerId" TEXT,
    "shareType" "ShareType" NOT NULL,
    "sharedWithEmail" TEXT,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DreamShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DreamShare_shareToken_key" ON "DreamShare"("shareToken");

-- CreateIndex
CREATE INDEX "DreamShare_ownerId_idx" ON "DreamShare"("ownerId");

-- CreateIndex
CREATE INDEX "DreamShare_dreamId_idx" ON "DreamShare"("dreamId");

-- CreateIndex
CREATE INDEX "DreamShare_dreamerId_idx" ON "DreamShare"("dreamerId");

-- CreateIndex
CREATE INDEX "DreamShare_sharedWithEmail_idx" ON "DreamShare"("sharedWithEmail");

-- AddForeignKey
ALTER TABLE "DreamShare" ADD CONSTRAINT "DreamShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamShare" ADD CONSTRAINT "DreamShare_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamShare" ADD CONSTRAINT "DreamShare_dreamerId_fkey" FOREIGN KEY ("dreamerId") REFERENCES "Dreamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

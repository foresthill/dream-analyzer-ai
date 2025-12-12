-- CreateTable
CREATE TABLE "AnalysisConversation" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisConversation_analysisId_idx" ON "AnalysisConversation"("analysisId");

-- AddForeignKey
ALTER TABLE "AnalysisConversation" ADD CONSTRAINT "AnalysisConversation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "DreamAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
ADD COLUMN     "preferredProvider" TEXT NOT NULL DEFAULT 'anthropic';

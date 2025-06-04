-- AlterTable
ALTER TABLE "spots" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

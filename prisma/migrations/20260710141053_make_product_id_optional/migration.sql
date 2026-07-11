-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_productId_fkey";

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

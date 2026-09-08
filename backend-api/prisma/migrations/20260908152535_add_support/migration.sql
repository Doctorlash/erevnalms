-- CreateEnum
CREATE TYPE "ContactMessageType" AS ENUM ('CONTACT', 'SUPPORT');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "type" "ContactMessageType" NOT NULL DEFAULT 'CONTACT',
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "ContactMessage_userId_idx" ON "ContactMessage"("userId");

-- CreateIndex
CREATE INDEX "ContactMessage_type_idx" ON "ContactMessage"("type");

-- CreateIndex
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

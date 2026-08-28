/*
  Warnings:

  - Added the required column `participantOneId` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantTwoId` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "participantOneId" TEXT NOT NULL,
ADD COLUMN     "participantTwoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeen" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantOneId_fkey" FOREIGN KEY ("participantOneId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantTwoId_fkey" FOREIGN KEY ("participantTwoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

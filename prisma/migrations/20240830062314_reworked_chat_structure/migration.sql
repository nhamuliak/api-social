/*
  Warnings:

  - You are about to drop the column `conversationId` on the `Messages` table. All the data in the column will be lost.
  - You are about to drop the `Conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserConversations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roomId` to the `Messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "UserConversations" DROP CONSTRAINT "UserConversations_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "UserConversations" DROP CONSTRAINT "UserConversations_userId_fkey";

-- AlterTable
ALTER TABLE "Messages" DROP COLUMN "conversationId",
ADD COLUMN     "roomId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Conversations";

-- DropTable
DROP TABLE "UserConversations";

-- CreateTable
CREATE TABLE "RoomUsers" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "RoomUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooms" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomUsers_roomId_idx" ON "RoomUsers"("roomId");

-- CreateIndex
CREATE INDEX "RoomUsers_userId_idx" ON "RoomUsers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomUsers_roomId_userId_key" ON "RoomUsers"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "RoomUsers" ADD CONSTRAINT "RoomUsers_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUsers" ADD CONSTRAINT "RoomUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

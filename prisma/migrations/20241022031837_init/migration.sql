/*
  Warnings:

  - You are about to drop the `NotificationUserData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "NotificationUserData";

-- CreateTable
CREATE TABLE "UserData" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserData_uid_key" ON "UserData"("uid");

/*
  Warnings:

  - You are about to drop the column `caseId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the `Case` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,patientId]` on the table `Note` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `patientId` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_caseId_fkey";

-- DropIndex
DROP INDEX "Note_studentId_caseId_key";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "caseId",
ADD COLUMN     "patientId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Case";

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "caseTitle" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "codeStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChiefComplaint" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "complaintText" TEXT NOT NULL,

    CONSTRAINT "ChiefComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChiefComplaint_patientId_idx" ON "ChiefComplaint"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_studentId_patientId_key" ON "Note"("studentId", "patientId");

-- AddForeignKey
ALTER TABLE "ChiefComplaint" ADD CONSTRAINT "ChiefComplaint_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

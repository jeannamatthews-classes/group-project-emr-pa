-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "facultyCreatorId" TEXT;

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignedByFacultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_facultyCreatorId_idx" ON "Patient"("facultyCreatorId");

-- CreateIndex
CREATE INDEX "CaseAssignment_patientId_idx" ON "CaseAssignment"("patientId");

-- CreateIndex
CREATE INDEX "CaseAssignment_studentId_idx" ON "CaseAssignment"("studentId");

-- CreateIndex
CREATE INDEX "CaseAssignment_assignedByFacultyId_idx" ON "CaseAssignment"("assignedByFacultyId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAssignment_patientId_studentId_key" ON "CaseAssignment"("patientId", "studentId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_facultyCreatorId_fkey" FOREIGN KEY ("facultyCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_assignedByFacultyId_fkey" FOREIGN KEY ("assignedByFacultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

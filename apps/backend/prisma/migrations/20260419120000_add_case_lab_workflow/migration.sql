CREATE TABLE "CaseLab" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "originalFilename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isVisibleToStudent" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByFacultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseLab_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CaseLab_patientId_idx" ON "CaseLab"("patientId");
CREATE INDEX "CaseLab_uploadedByFacultyId_idx" ON "CaseLab"("uploadedByFacultyId");
CREATE INDEX "CaseLab_patientId_isVisibleToStudent_idx" ON "CaseLab"("patientId", "isVisibleToStudent");

ALTER TABLE "CaseLab"
ADD CONSTRAINT "CaseLab_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseLab"
ADD CONSTRAINT "CaseLab_uploadedByFacultyId_fkey"
FOREIGN KEY ("uploadedByFacultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

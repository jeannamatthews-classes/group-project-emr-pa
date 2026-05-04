CREATE TABLE "CaseTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "codeStatus" TEXT NOT NULL,
    "caseType" TEXT NOT NULL DEFAULT 'pbl',
    "hasLabs" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdByFacultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseTemplateChiefComplaint" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "CaseTemplateChiefComplaint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Patient" ADD COLUMN "templateId" TEXT;

CREATE INDEX "CaseTemplate_createdByFacultyId_idx" ON "CaseTemplate"("createdByFacultyId");
CREATE INDEX "CaseTemplate_title_idx" ON "CaseTemplate"("title");
CREATE INDEX "CaseTemplate_caseType_idx" ON "CaseTemplate"("caseType");
CREATE INDEX "CaseTemplateChiefComplaint_templateId_idx" ON "CaseTemplateChiefComplaint"("templateId");
CREATE INDEX "Patient_templateId_idx" ON "Patient"("templateId");

ALTER TABLE "CaseTemplate" ADD CONSTRAINT "CaseTemplate_createdByFacultyId_fkey" FOREIGN KEY ("createdByFacultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CaseTemplateChiefComplaint" ADD CONSTRAINT "CaseTemplateChiefComplaint_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CaseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CaseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

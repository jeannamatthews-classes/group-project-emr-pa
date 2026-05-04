CREATE TABLE "CaseTemplateLab" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
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

    CONSTRAINT "CaseTemplateLab_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CaseTemplateLab_templateId_idx" ON "CaseTemplateLab"("templateId");
CREATE INDEX "CaseTemplateLab_uploadedByFacultyId_idx" ON "CaseTemplateLab"("uploadedByFacultyId");

ALTER TABLE "CaseTemplateLab" ADD CONSTRAINT "CaseTemplateLab_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CaseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseTemplateLab" ADD CONSTRAINT "CaseTemplateLab_uploadedByFacultyId_fkey" FOREIGN KEY ("uploadedByFacultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

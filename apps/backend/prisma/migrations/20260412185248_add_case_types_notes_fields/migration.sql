-- AlterTable: Patient
ALTER TABLE "Patient"
ADD COLUMN "caseType" TEXT NOT NULL DEFAULT 'pbl',
ADD COLUMN "hasLabs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profilePictureUrl" TEXT;

-- AlterTable: Note
ALTER TABLE "Note"
ALTER COLUMN "hpi" SET DEFAULT '',
ALTER COLUMN "physicalExam" SET DEFAULT '',
ADD COLUMN "medications" TEXT,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "familyHistory" TEXT,
ADD COLUMN "socialHistory" TEXT,
ADD COLUMN "procedures" TEXT,
ADD COLUMN "diagnosis" TEXT,
ADD COLUMN "labAndDiagnostics" TEXT,
ADD COLUMN "codingAndBilling" TEXT,
ADD COLUMN "learningIssues" TEXT,
ADD COLUMN "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "grade" DOUBLE PRECISION;

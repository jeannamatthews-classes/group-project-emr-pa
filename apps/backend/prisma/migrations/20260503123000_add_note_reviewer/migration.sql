ALTER TABLE "Note" ADD COLUMN "reviewedByFacultyId" TEXT;
ALTER TABLE "Note" ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "Note_reviewedByFacultyId_idx" ON "Note"("reviewedByFacultyId");

ALTER TABLE "Note" ADD CONSTRAINT "Note_reviewedByFacultyId_fkey" FOREIGN KEY ("reviewedByFacultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

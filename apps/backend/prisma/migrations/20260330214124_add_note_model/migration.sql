-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "caseId" INTEGER NOT NULL,
    "hpi" TEXT NOT NULL,
    "physicalExam" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_studentId_caseId_key" ON "Note"("studentId", "caseId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

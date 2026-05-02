-- Course cohorts for faculty-scoped case access.
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdByFacultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseMember" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Patient" ADD COLUMN "courseId" TEXT;

CREATE INDEX "Course_createdByFacultyId_idx" ON "Course"("createdByFacultyId");
CREATE INDEX "Course_name_idx" ON "Course"("name");
CREATE UNIQUE INDEX "CourseMember_courseId_userId_key" ON "CourseMember"("courseId", "userId");
CREATE INDEX "CourseMember_courseId_role_idx" ON "CourseMember"("courseId", "role");
CREATE INDEX "CourseMember_userId_role_idx" ON "CourseMember"("userId", "role");
CREATE INDEX "Patient_courseId_idx" ON "Patient"("courseId");

ALTER TABLE "Course" ADD CONSTRAINT "Course_createdByFacultyId_fkey" FOREIGN KEY ("createdByFacultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CourseMember" ADD CONSTRAINT "CourseMember_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseMember" ADD CONSTRAINT "CourseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

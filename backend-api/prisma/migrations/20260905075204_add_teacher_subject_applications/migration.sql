-- CreateEnum
CREATE TYPE "TeacherApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TeacherSubjectApplication" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "programme" "StudentProgrammeType" NOT NULL,
    "status" "TeacherApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherSubjectApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherSubjectApplication_teacherId_idx" ON "TeacherSubjectApplication"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSubjectApplication_subjectId_idx" ON "TeacherSubjectApplication"("subjectId");

-- CreateIndex
CREATE INDEX "TeacherSubjectApplication_programme_idx" ON "TeacherSubjectApplication"("programme");

-- CreateIndex
CREATE INDEX "TeacherSubjectApplication_status_idx" ON "TeacherSubjectApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubjectApplication_teacherId_subjectId_programme_key" ON "TeacherSubjectApplication"("teacherId", "subjectId", "programme");

-- AddForeignKey
ALTER TABLE "TeacherSubjectApplication" ADD CONSTRAINT "TeacherSubjectApplication_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubjectApplication" ADD CONSTRAINT "TeacherSubjectApplication_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

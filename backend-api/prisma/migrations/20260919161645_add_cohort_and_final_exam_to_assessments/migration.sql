-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "cohortId" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "cohortId" TEXT,
ADD COLUMN     "isFinalExam" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Assignment_cohortId_idx" ON "Assignment"("cohortId");

-- CreateIndex
CREATE INDEX "Exam_cohortId_idx" ON "Exam"("cohortId");

-- CreateIndex
CREATE INDEX "Exam_isFinalExam_idx" ON "Exam"("isFinalExam");

-- CreateIndex
CREATE INDEX "Exam_cohortId_isFinalExam_idx" ON "Exam"("cohortId", "isFinalExam");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

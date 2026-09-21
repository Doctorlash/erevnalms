/*
  Warnings:

  - A unique constraint covering the columns `[verificationCode]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentCohortId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cohortId` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `completionDate` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programme` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentCohortId` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationCode` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ISSUED', 'REVOKED');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "cohortId" TEXT NOT NULL,
ADD COLUMN     "completionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "programme" "StudentProgrammeType" NOT NULL,
ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" "CertificateStatus" NOT NULL DEFAULT 'ISSUED',
ADD COLUMN     "studentCohortId" TEXT NOT NULL,
ADD COLUMN     "verificationCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "Certificate_cohortId_idx" ON "Certificate"("cohortId");

-- CreateIndex
CREATE INDEX "Certificate_programme_idx" ON "Certificate"("programme");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- CreateIndex
CREATE INDEX "Certificate_issuedAt_idx" ON "Certificate"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_studentCohortId_key" ON "Certificate"("studentCohortId");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentCohortId_fkey" FOREIGN KEY ("studentCohortId") REFERENCES "StudentCohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

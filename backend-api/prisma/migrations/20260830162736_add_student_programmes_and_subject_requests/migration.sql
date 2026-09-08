-- CreateEnum
CREATE TYPE "StudentProgrammeType" AS ENUM ('JAMB', 'WAEC', 'LEADERSHIP');

-- CreateEnum
CREATE TYPE "SubjectRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "StudentProgramme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programme" "StudentProgrammeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "programme" "StudentProgrammeType" NOT NULL,
    "status" "SubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentProgramme_userId_idx" ON "StudentProgramme"("userId");

-- CreateIndex
CREATE INDEX "StudentProgramme_programme_idx" ON "StudentProgramme"("programme");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgramme_userId_programme_key" ON "StudentProgramme"("userId", "programme");

-- CreateIndex
CREATE INDEX "SubjectRequest_userId_idx" ON "SubjectRequest"("userId");

-- CreateIndex
CREATE INDEX "SubjectRequest_subjectId_idx" ON "SubjectRequest"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectRequest_programme_idx" ON "SubjectRequest"("programme");

-- CreateIndex
CREATE INDEX "SubjectRequest_status_idx" ON "SubjectRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectRequest_userId_subjectId_programme_key" ON "SubjectRequest"("userId", "subjectId", "programme");

-- AddForeignKey
ALTER TABLE "StudentProgramme" ADD CONSTRAINT "StudentProgramme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectRequest" ADD CONSTRAINT "SubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectRequest" ADD CONSTRAINT "SubjectRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[attemptId,questionId]` on the table `ExamAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId");

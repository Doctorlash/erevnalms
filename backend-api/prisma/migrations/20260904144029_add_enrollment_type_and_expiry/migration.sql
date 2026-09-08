/*
  Erevna LMS
  Migration: add_enrollment_type_and_expiry

  Existing subjects:
    Biology
    English
    Mathematics
    physics

  Existing Subject records are preserved as JAMB.
  WAEC copies are created.

  Existing StudentProgramme, SubjectRequest and Enrollment records:
    0
*/

-- ============================================================
-- 1. Create EnrollmentType
-- ============================================================

CREATE TYPE "EnrollmentType" AS ENUM ('FREE', 'PAID');


-- ============================================================
-- 2. Replace StudentProgrammeType
--    Remove obsolete LEADERSHIP value.
--
--    StudentProgramme and SubjectRequest are empty, so there
--    are no existing values that need conversion.
-- ============================================================

BEGIN;

CREATE TYPE "StudentProgrammeType_new" AS ENUM ('JAMB', 'WAEC');

ALTER TABLE "StudentProgramme"
  ALTER COLUMN "programme"
  TYPE "StudentProgrammeType_new"
  USING ("programme"::text::"StudentProgrammeType_new");

ALTER TABLE "SubjectRequest"
  ALTER COLUMN "programme"
  TYPE "StudentProgrammeType_new"
  USING ("programme"::text::"StudentProgrammeType_new");

ALTER TYPE "StudentProgrammeType"
  RENAME TO "StudentProgrammeType_old";

ALTER TYPE "StudentProgrammeType_new"
  RENAME TO "StudentProgrammeType";

DROP TYPE "StudentProgrammeType_old";

COMMIT;


-- ============================================================
-- 3. Remove old Subject.name unique constraint
--
--    We need to allow:
--      Biology + JAMB
--      Biology + WAEC
-- ============================================================

DROP INDEX IF EXISTS "Subject_name_key";


-- ============================================================
-- 4. Add Subject.programme as nullable first
--
--    We cannot add it as NOT NULL because existing subjects
--    already exist.
-- ============================================================

ALTER TABLE "Subject"
ADD COLUMN "programme" "StudentProgrammeType";


-- ============================================================
-- 5. Existing subjects become JAMB
-- ============================================================

UPDATE "Subject"
SET "programme" = 'JAMB'::"StudentProgrammeType"
WHERE "id" IN (
  '4774326d-8cc3-4815-bb18-e0b6e92aefbe', -- Biology
  '0f3cce85-f955-429a-ba0b-541cceeab9a8', -- English
  'b77206cc-08aa-4399-bae7-1d2ec343bc72', -- Mathematics
  '3dd974b8-a1d4-49c8-ab24-ae45a92eabfd'  -- physics
);


-- ============================================================
-- 6. Create WAEC copies
--
--    We copy the existing subject information but generate
--    new IDs so JAMB and WAEC remain separate records.
-- ============================================================

INSERT INTO "Subject" (
  "id",
  "name",
  "description",
  "programme",
  "isActive",
  "createdAt",
  "updatedAt",
  "teacherId"
)
SELECT
  gen_random_uuid(),
  "name",
  "description",
  'WAEC'::"StudentProgrammeType",
  "isActive",
  "createdAt",
  "updatedAt",
  "teacherId"
FROM "Subject"
WHERE "id" IN (
  '4774326d-8cc3-4815-bb18-e0b6e92aefbe',
  '0f3cce85-f955-429a-ba0b-541cceeab9a8',
  'b77206cc-08aa-4399-bae7-1d2ec343bc72',
  '3dd974b8-a1d4-49c8-ab24-ae45a92eabfd'
);


-- ============================================================
-- 7. Make Subject.programme required
-- ============================================================

ALTER TABLE "Subject"
ALTER COLUMN "programme" SET NOT NULL;


-- ============================================================
-- 8. Add Enrollment fields
--
--    Enrollment table currently has 0 rows, so programme can
--    safely be added as required.
-- ============================================================

ALTER TABLE "Enrollment"
ADD COLUMN "programme" "StudentProgrammeType" NOT NULL,
ADD COLUMN "type" "EnrollmentType" NOT NULL DEFAULT 'FREE',
ADD COLUMN "expiresAt" TIMESTAMP(3);


-- ============================================================
-- 9. Indexes
-- ============================================================

CREATE INDEX "Enrollment_userId_idx"
ON "Enrollment"("userId");

CREATE INDEX "Enrollment_subjectId_idx"
ON "Enrollment"("subjectId");

CREATE INDEX "Enrollment_programme_idx"
ON "Enrollment"("programme");

CREATE INDEX "Enrollment_type_idx"
ON "Enrollment"("type");

CREATE INDEX "Enrollment_expiresAt_idx"
ON "Enrollment"("expiresAt");

CREATE INDEX "Subject_programme_idx"
ON "Subject"("programme");

CREATE INDEX "Subject_teacherId_idx"
ON "Subject"("teacherId");


-- ============================================================
-- 10. Programme-aware Subject uniqueness
--
--    Allows:
--      Biology/JAMB
--      Biology/WAEC
--
--    But prevents duplicate Biology/JAMB records.
-- ============================================================

CREATE UNIQUE INDEX "Subject_name_programme_key"
ON "Subject"("name", "programme");
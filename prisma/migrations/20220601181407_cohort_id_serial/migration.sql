-- AlterTable
CREATE SEQUENCE "cohort_id_seq";
ALTER TABLE "Cohort" ALTER COLUMN "id" SET DEFAULT nextval('cohort_id_seq');
ALTER SEQUENCE "cohort_id_seq" OWNED BY "Cohort"."id";

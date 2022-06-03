/*
  Warnings:

  - The values [Volstok] on the enum `AchievementLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AchievementLevel_new" AS ENUM ('Vostok', 'Gemini', 'Apollo', 'Artemis');
ALTER TABLE "Project" ALTER COLUMN "achievement" TYPE "AchievementLevel_new" USING ("achievement"::text::"AchievementLevel_new");
ALTER TYPE "AchievementLevel" RENAME TO "AchievementLevel_old";
ALTER TYPE "AchievementLevel_new" RENAME TO "AchievementLevel";
DROP TYPE "AchievementLevel_old";
COMMIT;

-- CreateEnum
CREATE TYPE "MealKind" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'extra');

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN "kind" "MealKind";

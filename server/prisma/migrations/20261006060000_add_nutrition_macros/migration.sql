-- Optional protein/fat/carbs per meal plus the body profile behind the calorie estimate
ALTER TABLE "NutritionSettings" ADD COLUMN IF NOT EXISTS "macrosEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NutritionSettings" ADD COLUMN IF NOT EXISTS "bodySex" TEXT;
ALTER TABLE "NutritionSettings" ADD COLUMN IF NOT EXISTS "bodyAge" INTEGER;
ALTER TABLE "NutritionSettings" ADD COLUMN IF NOT EXISTS "bodyHeightCm" INTEGER;
ALTER TABLE "NutritionSettings" ADD COLUMN IF NOT EXISTS "bodyActivity" TEXT;

ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "protein" DOUBLE PRECISION;
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "fat" DOUBLE PRECISION;
ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "carbs" DOUBLE PRECISION;

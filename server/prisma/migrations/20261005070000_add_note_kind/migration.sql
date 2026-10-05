-- CreateEnum
CREATE TYPE "NoteKind" AS ENUM ('page', 'snippet');

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "kind" "NoteKind" NOT NULL DEFAULT 'page';
ALTER TABLE "Note" ALTER COLUMN "title" SET DEFAULT '';

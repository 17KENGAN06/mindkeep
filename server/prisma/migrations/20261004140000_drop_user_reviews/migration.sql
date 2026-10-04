DELETE FROM "AdminAuditEvent"
WHERE action IN ('REVIEW_APPROVED', 'REVIEW_REJECTED');

DROP TABLE IF EXISTS "UserReview";
DROP TYPE IF EXISTS "UserReviewStatus";

ALTER TYPE "AdminAuditAction" RENAME TO "AdminAuditAction_old";

CREATE TYPE "AdminAuditAction" AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'GOOGLE_LOGIN',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'BETA_GRANTED',
  'BETA_REVOKED'
);

ALTER TABLE "AdminAuditEvent"
ALTER COLUMN "action" TYPE "AdminAuditAction"
USING ("action"::text::"AdminAuditAction");

DROP TYPE "AdminAuditAction_old";

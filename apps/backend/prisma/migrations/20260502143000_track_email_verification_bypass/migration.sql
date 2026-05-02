ALTER TABLE "User" ADD COLUMN "emailVerificationBypassedAt" TIMESTAMP(3);

UPDATE "User" AS u
SET
  "emailVerificationBypassedAt" = u."emailVerifiedAt",
  "emailVerifiedAt" = NULL
WHERE
  u."emailVerifiedAt" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "AuditLog" AS a
    WHERE a."targetUserId" = u."id"
      AND a."eventType" = 'EMAIL_VERIFIED'
  );

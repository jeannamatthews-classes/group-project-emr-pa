-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationCodeHash" TEXT,
ADD COLUMN     "verificationResendAvailableAt" TIMESTAMP(3);

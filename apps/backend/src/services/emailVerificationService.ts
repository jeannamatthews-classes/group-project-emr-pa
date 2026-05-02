import crypto from 'crypto';
import { prisma } from '../db';
import { sendVerificationCodeEmail } from './emailService';

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

type IssueVerificationCodeInput = {
  userId: string;
  email: string;
};

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function issueVerificationCode(input: IssueVerificationCodeInput): Promise<void> {
  const code = generateVerificationCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS * 1000);

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      verificationCodeHash: hashVerificationCode(code),
      verificationCodeExpiresAt: expiresAt,
      verificationAttempts: 0,
      verificationResendAvailableAt: resendAvailableAt,
    },
  });

  await sendVerificationCodeEmail({
    toEmail: input.email,
    code,
    expiresInMinutes: VERIFICATION_CODE_EXPIRY_MINUTES,
  });
}

export async function verifyEmailCode(email: string, submittedCode: string): Promise<'verified' | 'invalid' | 'expired' | 'too_many_attempts'> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      emailVerifiedAt: true,
      verificationCodeHash: true,
      verificationCodeExpiresAt: true,
      verificationAttempts: true,
    },
  });

  if (!user || user.emailVerifiedAt) {
    return 'invalid';
  }

  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
    return 'expired';
  }

  if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    return 'too_many_attempts';
  }

  if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
    return 'expired';
  }

  const submittedHash = hashVerificationCode(submittedCode);
  if (submittedHash !== user.verificationCodeHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationAttempts: { increment: 1 } },
    });
    return 'invalid';
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationBypassedAt: null,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
      verificationResendAvailableAt: null,
    },
  });

  return 'verified';
}

export async function resendVerificationCode(email: string): Promise<'sent' | 'cooldown' | 'ignored'> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      verificationResendAvailableAt: true,
    },
  });

  if (!user || user.emailVerifiedAt) {
    return 'ignored';
  }

  if (
    user.verificationResendAvailableAt &&
    user.verificationResendAvailableAt.getTime() > Date.now()
  ) {
    return 'cooldown';
  }

  await issueVerificationCode({ userId: user.id, email: user.email });
  return 'sent';
}

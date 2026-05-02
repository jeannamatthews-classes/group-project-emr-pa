import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authMiddleware } from '../middleware/auth';
import { isEmailVerificationDisabled } from '../config/env';
import { createAuditLog } from '../services/auditLogService';
import {
  issueVerificationCode,
  verifyEmailCode,
  resendVerificationCode,
} from '../services/emailVerificationService';

//renamed branch
const router = express.Router();

function normalizeNamePart(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getUserDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string;
}): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

function isClarksonEmail(email: string): boolean {
  return email.endsWith('@clarkson.edu');
}

/**
 * Code to register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { username, firstName, lastName, email, password, confirmPassword } = body as {
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedFirstName = normalizeNamePart(firstName);
    const normalizedLastName = normalizeNamePart(lastName);
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validation
    if (!normalizedUsername || !normalizedFirstName || !normalizedLastName || !normalizedEmail || !password || !confirmPassword) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const skipEmailVerification = isEmailVerificationDisabled();

    if (!skipEmailVerification && !isClarksonEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Email must end in @clarkson.edu' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'unassigned',
        ...(skipEmailVerification ? { emailVerificationBypassedAt: new Date() } : {}),
      },
    });

    await createAuditLog({
      eventType: 'USER_REGISTERED',
      message: `User ${getUserDisplayName(user)} registered`,
      targetUserId: user.id,
    });

    if (!skipEmailVerification) {
      await issueVerificationCode({ userId: user.id, email: user.email });
      await createAuditLog({
        eventType: 'VERIFICATION_CODE_SENT',
        message: `Verification code sent to ${user.email}`,
        targetUserId: user.id,
      });
    }

    res.status(201).json({
      message: skipEmailVerification
        ? 'User registered successfully.'
        : 'User registered successfully. Please verify your email before continuing.',
      requiresEmailVerification: !skipEmailVerification,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      ...(skipEmailVerification ? { token: generateToken(user.id) } : {}),
    });
  } catch (error) {
    console.error('Registration error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to register user',
      ...(process.env.NODE_ENV !== 'production' ? { details } : {}),
    });
  }
});

/**
 * Code to login an existing user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { email, password } = body as {
      email?: string;
      password?: string;
    };
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validation
    if (!normalizedEmail || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const skipEmailVerification = isEmailVerificationDisabled();

    if (!skipEmailVerification && user.emailVerificationBypassedAt) {
      res.status(403).json({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true,
      });
      return;
    }

    if (!skipEmailVerification && !user.emailVerifiedAt) {
      res.status(403).json({
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true,
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to login',
      ...(process.env.NODE_ENV !== 'production' ? { details } : {}),
    });
  }
});

router.post('/verify-email-code', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { email, code } = body as { email?: string; code?: string };
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.trim() : '';

    if (!normalizedEmail || !normalizedCode) {
      res.status(400).json({ error: 'Email and code are required' });
      return;
    }

    if (!isEmailVerificationDisabled() && !isClarksonEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Email must end in @clarkson.edu' });
      return;
    }

    const result = await verifyEmailCode(normalizedEmail, normalizedCode);

    if (result === 'invalid') {
      await createAuditLog({
        eventType: 'EMAIL_VERIFICATION_FAILED',
        message: `Email verification failed for ${normalizedEmail}`,
      });
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    if (result === 'expired') {
      res.status(400).json({ error: 'Verification code has expired' });
      return;
    }

    if (result === 'too_many_attempts') {
      res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await createAuditLog({
      eventType: 'EMAIL_VERIFIED',
      message: `Email verified for ${user.email}`,
      targetUserId: user.id,
    });

    const token = generateToken(user.id);
    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to verify email code',
      ...(process.env.NODE_ENV !== 'production' ? { details } : {}),
    });
  }
});

router.post('/resend-email-code', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { email } = body as { email?: string };
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    if (!isEmailVerificationDisabled() && !isClarksonEmail(normalizedEmail)) {
      res.status(200).json({
        message: 'If an unverified account exists for this email, a new verification code has been sent.',
      });
      return;
    }

    const result = await resendVerificationCode(normalizedEmail);

    if (result === 'cooldown') {
      res.status(429).json({ error: 'Please wait before requesting another verification code.' });
      return;
    }

    if (result === 'sent') {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      await createAuditLog({
        eventType: 'VERIFICATION_CODE_SENT',
        message: `Verification code resent to ${normalizedEmail}`,
        targetUserId: user?.id,
      });
    }

    res.status(200).json({
      message: 'If an unverified account exists for this email, a new verification code has been sent.',
    });
  } catch (error) {
    console.error('Resend email code error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to resend verification code',
      ...(process.env.NODE_ENV !== 'production' ? { details } : {}),
    });
  }
});

/**
 * Current user profile (protected route)
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const firstName = normalizeNamePart((body as { firstName?: string }).firstName);
    const lastName = normalizeNamePart((body as { lastName?: string }).lastName);

    if (!firstName || !lastName) {
      res.status(400).json({ error: 'First name and last name are required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const currentPassword = (body as { currentPassword?: string }).currentPassword;
    const newPassword = (body as { newPassword?: string }).newPassword;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: 'New password must be different from current password' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordMatch = await comparePassword(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change own password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;

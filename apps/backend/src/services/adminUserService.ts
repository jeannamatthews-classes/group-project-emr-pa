import { prisma } from '../db';
import { createAuditLog } from './auditLogService';
import { comparePassword, hashPassword } from '../utils/auth';
import type {
  AdminUserListItem,
  AdminUsersResponse,
  AdminDeleteUserResponse,
  AdminUpdateUserRoleResponse,
  UserRole,
} from '../types/admin';

export async function listAllUsers(): Promise<AdminUsersResponse> {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users as AdminUserListItem[],
    total,
  };
}

export async function deleteUserById(
  userId: string,
  actorUserId: string
): Promise<AdminDeleteUserResponse> {
  if (userId === actorUserId) {
    throw new Error('Admins cannot delete their own account');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin account');
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  await createAuditLog({
    eventType: 'USER_DELETED',
    message: `User ${user.email} was deleted`,
    actorUserId,
    metadata: { userId, username: user.username, email: user.email },
  });

  return {
    message: 'User deleted successfully',
    deletedUserId: userId,
  };
}

export async function updateUserRoleById(
  userId: string,
  role: UserRole,
  actorUserId: string
): Promise<AdminUpdateUserRoleResponse> {
  if (userId === actorUserId) {
    throw new Error('Admins cannot change their own role');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === role) {
    return {
      message: 'Role is already set',
      user: user as AdminUserListItem,
    };
  }

  if (user.role === 'admin' && role !== 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      throw new Error('Cannot change role of the last admin account');
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    eventType: 'USER_ROLE_CHANGED',
    message: `User ${user.email} role changed from ${user.role} to ${role}`,
    actorUserId,
    targetUserId: userId,
    metadata: {
      username: user.username,
      email: user.email,
      fromRole: user.role,
      toRole: role,
    },
  });

  return {
    message: 'User role updated successfully',
    user: updated as AdminUserListItem,
  };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  actorUserId: string
): Promise<{ message: string }> {
  if (userId === actorUserId) {
    throw new Error('Admins cannot reset their own password from user management');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  await createAuditLog({
    eventType: 'USER_PASSWORD_RESET',
    message: `Password reset for user ${user.email}`,
    actorUserId,
    targetUserId: userId,
    metadata: { username: user.username, email: user.email },
  });

  return { message: 'Password reset successfully' };
}

export async function changeAdminOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, username: true, password: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  const passwordMatch = await comparePassword(currentPassword, user.password);
  if (!passwordMatch) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await createAuditLog({
    eventType: 'ADMIN_PASSWORD_CHANGED',
    message: `Admin ${user.email} changed their password`,
    actorUserId: user.id,
    targetUserId: user.id,
    metadata: { username: user.username, email: user.email },
  });

  return { message: 'Password changed successfully' };
}

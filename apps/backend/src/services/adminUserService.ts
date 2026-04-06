import { prisma } from '../db';
import { createAuditLog } from './auditLogService';
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

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { listAllUsers, deleteUserById, updateUserRoleById, resetUserPassword } from '../services/adminUserService';
import type { UserRole } from '../types/admin';
import { getRecentAuditLogs } from '../services/auditLogService';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await listAllUsers();
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const result = await deleteUserById(String(req.params.id), req.userId!);
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete user';
    res.status(400).json({ error: msg });
  }
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const role = (body as { role?: string }).role;
    const allowedRoles: UserRole[] = ['admin', 'faculty', 'student', 'unassigned'];

    if (!role || !allowedRoles.includes(role as UserRole)) {
      res.status(400).json({ error: 'Invalid role value' });
      return;
    }

    const result = await updateUserRoleById(String(req.params.id), role as UserRole, req.userId!);
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update user role';
    res.status(400).json({ error: msg });
  }
});

router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const newPassword = (body as { newPassword?: string }).newPassword;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const result = await resetUserPassword(String(req.params.id), newPassword, req.userId!);
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to reset password';
    res.status(400).json({ error: msg });
  }
});

router.get('/logs', async (_req: Request, res: Response) => {
  try {
    const result = await getRecentAuditLogs();
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;

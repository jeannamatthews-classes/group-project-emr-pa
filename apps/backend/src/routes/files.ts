import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import { resolveExistingUploadPathFromUrl, resolveUploadPathFromUrl } from './uploads';

const router = express.Router();

function getRequestedUploadPath(req: Request): string {
  const wildcard = req.params.path ?? req.params[0] ?? '';
  const wildcardPath = Array.isArray(wildcard) ? wildcard.join('/') : String(wildcard);
  const normalized = wildcardPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized ? `/uploads/${normalized}` : '/uploads';
}

async function getRequestRole(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? null;
}

function canStudentSeePicture(userId: string, assignments: Array<{ studentId: string }>): boolean {
  return assignments.some((assignment) => assignment.studentId === userId);
}

function canFacultyAccessFacultyCase(role: string | null, facultyCreatorId: string | null): boolean {
  return (role === 'faculty' || role === 'admin') && facultyCreatorId !== null;
}

router.get('/*path', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const role = await getRequestRole(userId);
    if (!role) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const requestedUploadPath = getRequestedUploadPath(req);
    const absoluteFilePath = resolveExistingUploadPathFromUrl(requestedUploadPath);
    const normalizedRequestedPath = resolveUploadPathFromUrl(requestedUploadPath);

    if (!normalizedRequestedPath) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    const patientPicture = await prisma.patient.findFirst({
      where: { profilePictureUrl: requestedUploadPath },
      include: {
        assignments: {
          select: { studentId: true },
        },
      },
    });

    if (patientPicture) {
      const canViewPicture =
        canFacultyAccessFacultyCase(role, patientPicture.facultyCreatorId) ||
        canStudentSeePicture(userId, patientPicture.assignments);

      if (!canViewPicture) {
        res.status(403).json({ error: 'You do not have access to this file' });
        return;
      }

      if (!absoluteFilePath) {
        res.status(404).json({ error: 'Stored file is missing on disk' });
        return;
      }

      res.sendFile(absoluteFilePath);
      return;
    }

    const caseLab = await prisma.caseLab.findFirst({
      where: { fileUrl: requestedUploadPath },
      include: {
        patient: {
          include: {
            assignments: {
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!caseLab) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const isAssignedStudent = caseLab.patient.assignments.some(
      (assignment) => assignment.studentId === userId
    );
    const canViewLab =
      canFacultyAccessFacultyCase(role, caseLab.patient.facultyCreatorId) ||
      (isAssignedStudent && caseLab.isVisibleToStudent);

    if (!canViewLab) {
      res.status(403).json({ error: 'You do not have access to this file' });
      return;
    }

    if (!absoluteFilePath) {
      res.status(404).json({ error: 'Stored file is missing on disk' });
      return;
    }

    res.sendFile(absoluteFilePath);
  } catch (error) {
    console.error('GET /uploads/* error:', error);
    res.status(500).json({ error: 'Failed to load file' });
  }
});

export default router;

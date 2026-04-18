import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// GET /api/student/cases — assigned cases for the logged-in student
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const assignments = await prisma.caseAssignment.findMany({
      where: { studentId },
      include: {
        patient: {
          select: {
            id: true,
            caseTitle: true,
            name: true,
            caseType: true,
            hasLabs: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ assignments });
  } catch (error) {
    console.error('GET /api/student/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned cases' });
  }
});

// GET /api/student/grades — submitted notes with grades/feedback for logged-in student
router.get('/grades', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const notes = await prisma.note.findMany({
      where: { studentId, isSubmitted: true },
      include: {
        patient: {
          select: { id: true, caseTitle: true, name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ notes });
  } catch (error) {
    console.error('GET /api/student/grades error:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

function paramString(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

function parseCaseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function caseLabToStudentPayload(lab: {
  id: string;
  patientId: number;
  title: string;
  category: string | null;
  description: string | null;
  originalFilename: string;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: lab.id,
    caseId: lab.patientId,
    patientId: lab.patientId,
    title: lab.title,
    category: lab.category,
    description: lab.description,
    originalFilename: lab.originalFilename,
    fileUrl: lab.fileUrl,
    mimeType: lab.mimeType,
    createdAt: lab.createdAt,
    updatedAt: lab.updatedAt,
  };
}

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
      where: {
        studentId,
        patient: {
          facultyCreatorId: {
            not: null,
          },
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            caseTitle: true,
            name: true,
            location: true,
            dob: true,
            gender: true,
            codeStatus: true,
            caseType: true,
            hasLabs: true,
            profilePictureUrl: true,
          },
        },
        assignedByFaculty: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      assignments: assignments.map((assignment) => ({
        ...assignment,
        patient: {
          ...assignment.patient,
          patientName: assignment.patient.name,
          displayTitle: assignment.patient.name,
          assignedByFaculty: assignment.assignedByFaculty,
        },
      })),
    });
  } catch (error) {
    console.error('GET /api/student/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned cases' });
  }
});

// GET /api/student/cases/:id/labs - visible labs for an assigned case
router.get('/cases/:id/labs', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const assignment = await prisma.caseAssignment.findUnique({
      where: {
        patientId_studentId: {
          patientId: caseId,
          studentId,
        },
      },
      select: {
        id: true,
        patient: {
          select: {
            facultyCreatorId: true,
            hasLabs: true,
          },
        },
      },
    });

    if (!assignment || !assignment.patient.facultyCreatorId) {
      res.status(403).json({ error: 'You are not assigned to this case.' });
      return;
    }

    if (!assignment.patient.hasLabs) {
      res.json({ labs: [] });
      return;
    }

    const labs = await prisma.caseLab.findMany({
      where: {
        patientId: caseId,
        isVisibleToStudent: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    res.json({ labs: labs.map(caseLabToStudentPayload) });
  } catch (error) {
    console.error('GET /api/student/cases/:id/labs error:', error);
    res.status(500).json({ error: 'Failed to fetch case labs' });
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
      where: {
        studentId,
        isSubmitted: true,
        patient: {
          facultyCreatorId: {
            not: null,
          },
        },
      },
      include: {
        patient: {
          select: { id: true, caseTitle: true, name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({
      notes: notes.map((note) => ({
        ...note,
        patient: {
          ...note.patient,
          patientName: note.patient.name,
          displayTitle: note.patient.name,
        },
      })),
    });
  } catch (error) {
    console.error('GET /api/student/grades error:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

export default router;

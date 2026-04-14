import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

type NoteBody = {
  caseId?: unknown;
  hpi?: unknown;
  exam?: unknown;
  assessment?: unknown;
  treatmentPlan?: unknown;
  medications?: unknown;
  allergies?: unknown;
  familyHistory?: unknown;
  socialHistory?: unknown;
  procedures?: unknown;
  diagnosis?: unknown;
  labAndDiagnostics?: unknown;
  codingAndBilling?: unknown;
  learningIssues?: unknown;
};

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function paramString(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

function noteToResponse(note: {
  id: string;
  patientId: number;
  studentId: string;
  hpi: string;
  physicalExam: string;
  assessment: string | null;
  treatmentPlan: string | null;
  medications: string | null;
  allergies: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  procedures: string | null;
  diagnosis: string | null;
  labAndDiagnostics: string | null;
  codingAndBilling: string | null;
  learningIssues: string | null;
  isSubmitted: boolean;
  submittedAt: Date | null;
  grade: number | null;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...note,
    caseId: note.patientId,
    assess: note.assessment ?? '',
    treat: note.treatmentPlan ?? '',
  };
}

router.use(authMiddleware);

// GET /api/notes — get notes for logged-in student
router.get('/', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { caseId } = req.query;

    if (!caseId) {
      const notes = await prisma.note.findMany({
        where: { studentId },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ notes: notes.map(noteToResponse) });
      return;
    }

    const caseIdParsed = Array.isArray(caseId)
      ? parsePositiveInt(caseId[0])
      : parsePositiveInt(caseId);

    if (caseIdParsed === null) {
      res.status(400).json({ error: 'Invalid caseId' });
      return;
    }

    const note = await prisma.note.findUnique({
      where: { studentId_patientId: { studentId, patientId: caseIdParsed } },
    });

    if (!note) {
      res.status(404).json({ error: 'No note found for this case' });
      return;
    }

    res.json({ note: noteToResponse(note) });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes — upsert note for logged-in student
router.post('/', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const body = (req.body ?? {}) as NoteBody;
    const caseIdParsed = parsePositiveInt(body.caseId);
    const hpi = str(body.hpi);
    const exam = str(body.exam);

    if (caseIdParsed === null || hpi === null || exam === null) {
      res.status(400).json({ error: 'caseId, hpi, and exam are required' });
      return;
    }

    const medicalCase = await prisma.patient.findUnique({
      where: { id: caseIdParsed },
      select: { id: true },
    });

    if (!medicalCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const data = {
      hpi,
      physicalExam: exam,
      assessment: str(body.assessment),
      treatmentPlan: str(body.treatmentPlan),
      medications: str(body.medications),
      allergies: str(body.allergies),
      familyHistory: str(body.familyHistory),
      socialHistory: str(body.socialHistory),
      procedures: str(body.procedures),
      diagnosis: str(body.diagnosis),
      labAndDiagnostics: str(body.labAndDiagnostics),
      codingAndBilling: str(body.codingAndBilling),
      learningIssues: str(body.learningIssues),
    };

    const note = await prisma.note.upsert({
      where: { studentId_patientId: { studentId, patientId: caseIdParsed } },
      update: data,
      create: { studentId, patientId: caseIdParsed, ...data },
    });

    res.json({ note: noteToResponse(note) });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// PUT /api/notes/:id — update existing note
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const noteId = paramString(req.params.id);
    const existing = await prisma.note.findFirst({ where: { id: noteId, studentId } });

    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (existing.isSubmitted) {
      res.status(403).json({ error: 'Cannot edit a submitted note' });
      return;
    }

    const body = (req.body ?? {}) as NoteBody;
    const hpi = str(body.hpi);
    const exam = str(body.exam);

    if (hpi === null || exam === null) {
      res.status(400).json({ error: 'hpi and exam are required' });
      return;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        hpi,
        physicalExam: exam,
        assessment: str(body.assessment),
        treatmentPlan: str(body.treatmentPlan),
        medications: str(body.medications),
        allergies: str(body.allergies),
        familyHistory: str(body.familyHistory),
        socialHistory: str(body.socialHistory),
        procedures: str(body.procedures),
        diagnosis: str(body.diagnosis),
        labAndDiagnostics: str(body.labAndDiagnostics),
        codingAndBilling: str(body.codingAndBilling),
        learningIssues: str(body.learningIssues),
      },
    });

    res.json({ note: noteToResponse(updated) });
  } catch (error) {
    console.error('PUT /api/notes/:id error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// POST /api/notes/:id/submit — student submits their assignment
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const noteId = paramString(req.params.id);
    const existing = await prisma.note.findFirst({ where: { id: noteId, studentId } });

    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (existing.isSubmitted) {
      res.status(409).json({ error: 'Assignment already submitted' });
      return;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { isSubmitted: true, submittedAt: new Date() },
    });

    res.json({ note: noteToResponse(updated) });
  } catch (error) {
    console.error('POST /api/notes/:id/submit error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// POST /api/notes/:id/feedback — faculty adds feedback and/or grade
router.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Only faculty or admin can give feedback
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
      res.status(403).json({ error: 'Only faculty or admin can give feedback' });
      return;
    }

    const noteId = paramString(req.params.id);
    const body = (req.body ?? {}) as { feedback?: unknown; grade?: unknown };
    const feedback = str(body.feedback);
    const grade =
      typeof body.grade === 'number' && body.grade >= 0 && body.grade <= 100
        ? body.grade
        : typeof body.grade === 'string' && !isNaN(Number(body.grade))
        ? Number(body.grade)
        : null;

    if (feedback === null && grade === null) {
      res.status(400).json({ error: 'feedback or grade is required' });
      return;
    }

    const existing = await prisma.note.findUnique({ where: { id: noteId } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(feedback !== null && { feedback }),
        ...(grade !== null && { grade }),
      },
    });

    res.json({ note: noteToResponse(updated) });
  } catch (error) {
    console.error('POST /api/notes/:id/feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

export default router;

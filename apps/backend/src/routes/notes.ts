import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Type for the body of the request to upsert a note
type UpsertNoteBody = {
  caseId?: unknown;
  hpi?: unknown;
  // Uses the exam label but stores as physicalExam in the database
  exam?: unknown;
  assess?: unknown;
  treat?: unknown;
};

// Function to parse the caseId from the request body
function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

/** API adds `caseId` (same value as `patientId`) for legacy clients. */
function noteToResponse(
  note: {
    id: string;
    studentId: string;
    hpi: string;
    physicalExam: string;
    feedback: string | null;
    createdAt: Date;
    updatedAt: Date;
  } & ({ patientId: number } | { caseId: number })
) {
  const caseId = 'patientId' in note ? note.patientId : note.caseId;
  let assess = '';
  let treat = '';

  if (note.feedback) {
    try {
      const parsed = JSON.parse(note.feedback) as { assess?: unknown; treat?: unknown };
      assess = typeof parsed.assess === 'string' ? parsed.assess : '';
      treat = typeof parsed.treat === 'string' ? parsed.treat : '';
    } catch {
      assess = '';
      treat = '';
    }
  }

  return {
    ...note,
    caseId,
    assess,
    treat,
  };
}

function paramString(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

router.use(authMiddleware);

// Gets all notes for the logged-in student
router.get('/', async (req: Request, res: Response) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { caseId } = req.query;

    // If no caseId is provided, get all notes for the student
    if (!caseId) {
      const notes = await prisma.note.findMany({
        where: { studentId },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ notes: notes.map(noteToResponse) });
      return;
    }

    // Parse the caseId from the request query
    const caseIdParsed = Array.isArray(caseId)
      ? parsePositiveInt(caseId[0])
      : parsePositiveInt(caseId);

    // If the caseId is invalid, return an error
    if (caseIdParsed === null) {
      res.status(400).json({ error: 'Invalid caseId' });
      return;
    }

    // Get the note for the given caseId
    const note = await prisma.note.findUnique({
      where: {
        studentId_patientId: {
          studentId,
          patientId: caseIdParsed,
        },
      },
    });



    if (!note) {
      res.status(404).json({ error: 'No note found for this case' });
      return;
    }

    // Return the note
    res.json({ note: noteToResponse(note) });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes
router.post('/', async (req: Request, res: Response) => {
  // Upserts the logged-in student's note for a given caseId.
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const body = (req.body ?? {}) as UpsertNoteBody;
    const caseIdParsed = parsePositiveInt(body.caseId);
    const hpi = typeof body.hpi === 'string' ? body.hpi : null;
    const exam = typeof body.exam === 'string' ? body.exam : null;
    const assess = typeof body.assess === 'string' ? body.assess : '';
    const treat = typeof body.treat === 'string' ? body.treat : '';
    const feedback = assess || treat ? JSON.stringify({ assess, treat }) : null;

    // If the caseId, hpi, or exam is missing, return an error
    if (caseIdParsed === null || hpi === null || exam === null) {
      res.status(400).json({ error: 'caseId, hpi, and exam are required' });
      return;
    }

    // Get the medical case for the given caseId
    const medicalCase = await prisma.patient.findUnique({
      where: { id: caseIdParsed },
      select: { id: true },
    });

    // If the medical case is not found, return an error
    if (!medicalCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Upsert the note for the given caseId
    const note = await prisma.note.upsert({
      where: {
        studentId_patientId: {
          studentId,
          patientId: caseIdParsed,
        },
      },
      update: {
        hpi,
        physicalExam: exam,
        feedback,
      },
      create: {
        studentId,
        patientId: caseIdParsed,
        hpi,
        physicalExam: exam,
        feedback,
      },
    });

    // Return the note
    res.json({ note: noteToResponse(note) });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req: Request, res: Response) => {
  // Updates the logged-in student's note for a given noteId.
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const noteId = paramString(req.params.id);
    const body = (req.body ?? {}) as { hpi?: unknown; exam?: unknown; assess?: unknown; treat?: unknown };
    const hpi = typeof body.hpi === 'string' ? body.hpi : null;
    const exam = typeof body.exam === 'string' ? body.exam : null;
    const assess = typeof body.assess === 'string' ? body.assess : '';
    const treat = typeof body.treat === 'string' ? body.treat : '';
    const feedback = assess || treat ? JSON.stringify({ assess, treat }) : null;

    // If the hpi or exam is missing, return an error
    if (hpi === null || exam === null) {
      res.status(400).json({ error: 'hpi and exam are required' });
      return;
    }

    // Get the existing note for the given noteId
    const existing = await prisma.note.findFirst({
      where: { id: noteId, studentId },
    });

    // If the note is not found, return an error
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Update the note for the given noteId
    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { hpi, physicalExam: exam, feedback },
    });

    // Return the updated note
    res.json({ note: noteToResponse(updated) });
  } catch (error) {
    console.error('PUT /api/notes/:id error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// POST /api/notes/:id/feedback
router.post('/:id/feedback', async (req: Request, res: Response) => {
  // Adds feedback to the logged-in student's note for a given noteId.
  try {
    const studentId = req.userId;
    if (!studentId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const noteId = paramString(req.params.id);
    const body = (req.body ?? {}) as { feedback?: unknown };
    const feedback = typeof body.feedback === 'string' ? body.feedback : null;

    // If the feedback is missing, return an error
    if (feedback === null) {
      res.status(400).json({ error: 'feedback is required' });
      return;
    }

    // Get the existing note for the given noteId
    const existing = await prisma.note.findFirst({
      where: { id: noteId, studentId },
    });

    // If the note is not found, return an error
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Update the note for the given noteId
    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { feedback },
    });

    // Return the updated note
    res.json({ note: noteToResponse(updated) });
  } catch (error) {
    console.error('POST /api/notes/:id/feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

// Export the router for use in the index.ts file
export default router;

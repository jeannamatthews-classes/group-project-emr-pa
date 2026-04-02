import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/** Normalizes Express 5 `req.params` values for TypeScript. */
function paramString(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

function parseCaseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// Map DB Patient to the legacy JSON shape for existing clients.
function patientToCase(p: {
  id: number;
  caseTitle: string | null;
  name: string;
  location: string;
  dob: Date;
  gender: string;
  codeStatus: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    name: p.caseTitle?.trim() ? p.caseTitle : p.name,
    patient: p.name,
    location: p.location,
    dob: p.dob,
    gender: p.gender,
    codeStatus: p.codeStatus,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// Middleware to authenticate the user
router.use(authMiddleware);

// Get all cases (patients)
router.get('/', async (_req: Request, res: Response) => {
  // Get all patients
  try {
    const patients = await prisma.patient.findMany({
      // Order by id in ascending order
      orderBy: { id: 'asc' },
    });
    // Return the patients
    res.json({ cases: patients.map(patientToCase) });
  } catch (error) {
    console.error('GET /api/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/:id - Get a specific case by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    // If the caseId is invalid, return an error
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    // Get the patient for the given caseId
    const p = await prisma.patient.findUnique({
      where: { id: caseId },
    });

    // If the patient is not found, return an error
    if (!p) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Return the patient
    res.json({ case: patientToCase(p) });
  } catch (error) {
    console.error('GET /api/cases/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// GET all notes for a specific case (patient)
router.get('/:id/notes', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const exists = await prisma.patient.findUnique({
      where: { id: caseId },
      select: { id: true },
    });

    if (!exists) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const notes = await prisma.note.findMany({
      where: { patientId: caseId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ notes });
  } catch (error) {
    console.error('GET /api/cases/:id/notes error:', error);
    res.status(500).json({ error: 'Failed to fetch case notes' });
  }
});

// Creates a new case (patient row)
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    // If the body is not an object, return an error
    const { name, patient, location, dob, gender, codeStatus } = body as {
      name?: unknown;
      patient?: unknown;
      location?: unknown;
      dob?: unknown;
      gender?: unknown;
      codeStatus?: unknown;
    };

    // If the name or patient is not a string, return an error
    if (typeof name !== 'string' || typeof patient !== 'string' || !name.trim() || !patient.trim()) {
      res.status(400).json({ error: 'name and patient are required' });
      return;
    }

    // If the dob is not a string, return an error
    let dobDate = new Date('2000-01-01');
    if (typeof dob === 'string' && dob.trim()) {
      const parsed = new Date(dob);
      if (!Number.isNaN(parsed.getTime())) {
        dobDate = parsed;
      }
    }

    // Create the new case
    const created = await prisma.patient.create({
      data: {
        caseTitle: name.trim(),
        name: patient.trim(),
        location: typeof location === 'string' && location.trim() ? location.trim() : 'Unknown',
        dob: dobDate,
        gender: typeof gender === 'string' && gender.trim() ? gender.trim() : 'Unknown',
        codeStatus:
          typeof codeStatus === 'string' && codeStatus.trim() ? codeStatus.trim() : 'Full Code',
      },
    });

    // Return the new case
    res.status(201).json({ case: patientToCase(created) });
  } catch (error) {
    console.error('POST /api/cases error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Export the router for use in the index.ts file
export default router;

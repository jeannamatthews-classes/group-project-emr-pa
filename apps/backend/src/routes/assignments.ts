import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import { facultyOrAdminMiddleware } from '../middleware/facultyOrAdmin';

const router = express.Router();

// This function parses a positive integer from a string or number, this is needed to avoid type errors when
// parsing the patientId and studentId from the request body
function parsePositiveInt(value: unknown): number | null {
  // If the value is a number and it is an integer and it is greater than 0, return the value
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  // If the value is a string, parse it as a number and check if it is an integer and greater than 0, return the value
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

// This one checks to see if the user has permission to manage the patient
async function assertCanManagePatient(
  patientId: number,
  userId: string,
  role: string | undefined
) {
  // Find the patient by id
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { ok: false as const, reason: 'not_found' as const };
  if (role === 'admin') return { ok: true as const, patient };
  if (patient.facultyCreatorId === userId) return { ok: true as const, patient };
  return { ok: false as const, reason: 'forbidden' as const };
}

router.use(authMiddleware);
router.use(facultyOrAdminMiddleware);

// This route is used to get all the assignments for a patient, if the user is an admin, they can get all the assignments for all patients
router.get('/', async (req: Request, res: Response) => {
  // Tries to get the patientId from the request query
  try {
    const patientIdParam = req.query.patientId;
    const patientFilter =
      patientIdParam === undefined || patientIdParam === ''
        ? null
        : parsePositiveInt(Array.isArray(patientIdParam) ? patientIdParam[0] : patientIdParam);

    // If the patientId is invalid, return an error
    if (patientIdParam !== undefined && patientIdParam !== '' && patientFilter === null) {
      res.status(400).json({ error: 'Invalid patientId' });
      return;
    }

    // Allows the admin to get all the assignments for all patients
    if (req.userRole === 'admin') {
      const assignments = await prisma.caseAssignment.findMany({
        where: patientFilter ? { patientId: patientFilter } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          student: { select: { id: true, username: true, email: true } },
          assignedByFaculty: { select: { id: true, username: true, email: true } },
        },
      });
      res.json({ assignments });
      return;
    }

    // Allows the faculty to get all the assignments for their cases
    const facultyId = req.userId as string;
    const assignments = await prisma.caseAssignment.findMany({
      where: {
        patient: { facultyCreatorId: facultyId },
        ...(patientFilter ? { patientId: patientFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        student: { select: { id: true, username: true, email: true } },
        assignedByFaculty: { select: { id: true, username: true, email: true } },
      },
    });

    res.json({ assignments });
  } catch (error) {
    console.error('GET /api/assignments error:', error);
    res.status(500).json({ error: 'Failed to list assignments' });
  }
});

// This route is used to create a new assignment for a patient, it is only accessible to faculty and admins
router.post('/', async (req: Request, res: Response) => {
  try {
    // attempts to get the patientId and studentId from the request body
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const patientId = parsePositiveInt((body as { patientId?: unknown }).patientId);
    const studentId = (body as { studentId?: unknown }).studentId;

    // If the patientId or studentId is invalid, return an error
    if (patientId === null || typeof studentId !== 'string' || !studentId.trim()) {
      res.status(400).json({ error: 'patientId and studentId are required' });
      return;
    }

    // Checks to see if the user has permission to manage the patient
    const access = await assertCanManagePatient(patientId, req.userId!, req.userRole);
    if (!access.ok) {
      // If the patient is not found, return an error
      if (access.reason === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.status(403).json({ error: 'You can only assign students to cases you created' });
      return;
    }

    // Finds the student by id
    const student = await prisma.user.findUnique({
      where: { id: studentId.trim() },
      select: { id: true, role: true },
    });

    // If the student is not found or is not a student, return an error
    if (!student || student.role !== 'student') {
      res.status(400).json({ error: 'Target user must be a student' });
      return;
    }

    // Creates the assignment
    const assignment = await prisma.caseAssignment.create({
      data: {
        patientId,
        studentId: student.id,
        assignedByFacultyId: req.userId!,
      },
      include: {
        patient: true,
        student: { select: { id: true, username: true, email: true } },
        assignedByFaculty: { select: { id: true, username: true, email: true } },
      },
    });

    // Returns the assignment
    res.status(201).json({ assignment });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      res.status(409).json({ error: 'This student is already assigned to this case' });
      return;
    }
    console.error('POST /api/assignments error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

export default router;

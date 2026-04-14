import express, { Request, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import { facultyOrAdminMiddleware } from '../middleware/facultyOrAdmin';

const router = express.Router();

function paramString(id: string | string[] | undefined): string {
  const raw = Array.isArray(id) ? id[0] : id;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

function parseCaseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function patientToCase(p: {
  id: number;
  caseTitle: string | null;
  name: string;
  location: string;
  dob: Date;
  gender: string;
  codeStatus: string;
  caseType: string;
  hasLabs: boolean;
  profilePictureUrl: string | null;
  facultyCreatorId: string | null;
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
    caseType: p.caseType,
    hasLabs: p.hasLabs,
    profilePictureUrl: p.profilePictureUrl,
    facultyCreatorId: p.facultyCreatorId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

async function loadPatientForFaculty(
  patientId: number,
  userId: string,
  role: string | undefined
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      chiefComplaints: { orderBy: { id: 'asc' } },
      assignments: {
        include: {
          student: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!patient) return { error: 'not_found' as const };
  if (role === 'admin') return { patient };
  if (patient.facultyCreatorId === userId) return { patient };
  return { error: 'forbidden' as const };
}

router.use(authMiddleware);
router.use(facultyOrAdminMiddleware);

/** List student accounts (for assignment pickers). */
router.get('/students', async (_req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { username: 'asc' },
    });
    res.json({ students });
  } catch (error) {
    console.error('GET /api/faculty/students error:', error);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

/** Cases created by this faculty user (admins see all). */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const where =
      req.userRole === 'admin'
        ? {}
        : { facultyCreatorId: req.userId as string };

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        assignments: {
          include: {
            student: { select: { id: true, username: true, email: true } },
          },
        },
      },
    });

    res.json({
      cases: patients.map((p) => ({
        ...patientToCase(p),
        assignments: p.assignments.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          student: a.student,
          createdAt: a.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error('GET /api/faculty/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty cases' });
  }
});

/** Notes for a case with student identity (faculty-owned case or admin). */
router.get('/cases/:id/notes', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const access = await loadPatientForFaculty(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const notes = await prisma.note.findMany({
      where: { patientId: caseId },
      orderBy: { updatedAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, email: true } },
      },
    });

    res.json({
      notes: notes.map((n) => ({
        id: n.id,
        patientId: n.patientId,
        caseId: n.patientId,
        studentId: n.studentId,
        student: n.student,
        hpi: n.hpi,
        medications: n.medications,
        allergies: n.allergies,
        familyHistory: n.familyHistory,
        socialHistory: n.socialHistory,
        physicalExam: n.physicalExam,
        procedures: n.procedures,
        diagnosis: n.diagnosis,
        labAndDiagnostics: n.labAndDiagnostics,
        assessment: n.assessment,
        codingAndBilling: n.codingAndBilling,
        learningIssues: n.learningIssues,
        treatmentPlan: n.treatmentPlan,
        isSubmitted: n.isSubmitted,
        submittedAt: n.submittedAt,
        grade: n.grade,
        feedback: n.feedback,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/faculty/cases/:id/notes error:', error);
    res.status(500).json({ error: 'Failed to fetch case notes' });
  }
});

/** Case detail including chief complaints and current assignments. */
router.get('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const access = await loadPatientForFaculty(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const p = access.patient;
    res.json({
      case: {
        ...patientToCase(p),
        chiefComplaints: p.chiefComplaints,
        assignments: p.assignments.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          student: a.student,
          assignedByFacultyId: a.assignedByFacultyId,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/faculty/cases/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

export default router;

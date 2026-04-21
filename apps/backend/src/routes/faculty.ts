import express, { Request, Response } from 'express';
import path from 'path';
import { prisma } from '../db';
import { authMiddleware } from '../middleware/auth';
import { facultyOrAdminMiddleware } from '../middleware/facultyOrAdmin';
import {
  buildUploadUrl,
  deleteUploadFileIfExists,
  labUpload,
  type UploadedFileLike,
} from './uploads';

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
  const caseTitle = p.caseTitle?.trim() ? p.caseTitle : null;
  return {
    id: p.id,
    name: caseTitle ?? p.name,
    patient: p.name,
    caseTitle,
    patientName: p.name,
    displayTitle: p.name,
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

function isFacultyWorkflowRole(role: string | undefined): boolean {
  return role === 'faculty' || role === 'admin';
}

function getFacultyPatientWhere(userId: string, role: string | undefined) {
  return isFacultyWorkflowRole(role)
    ? {
        facultyCreatorId: {
          not: null,
        },
      }
    : { facultyCreatorId: userId };
}

function getNoteStatus(note: { isSubmitted: boolean; feedback: string | null; grade: number | null }): string {
  if (!note.isSubmitted) return 'draft';
  if (note.feedback !== null || note.grade !== null) return 'reviewed';
  return 'submitted';
}

function parseOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function caseLabToFacultyPayload(lab: {
  id: string;
  patientId: number;
  title: string;
  category: string | null;
  description: string | null;
  originalFilename: string;
  fileUrl: string;
  mimeType: string;
  isVisibleToStudent: boolean;
  createdAt: Date;
  updatedAt: Date;
  uploadedByFaculty?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
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
    isVisibleToStudent: lab.isVisibleToStudent,
    createdAt: lab.createdAt,
    updatedAt: lab.updatedAt,
    uploadedByFaculty: lab.uploadedByFaculty ?? null,
  };
}

function cleanupUploadedLabFile(uploadedFile?: UploadedFileLike) {
  if (!uploadedFile) return;
  deleteUploadFileIfExists(buildUploadUrl(uploadedFile));
}

async function assertFacultyCaseAccess(
  patientId: number,
  userId: string,
  role: string | undefined
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, facultyCreatorId: true, hasLabs: true },
  });

  if (!patient) return { error: 'not_found' as const };
  if (!patient.facultyCreatorId) return { error: 'not_found' as const };
  if (isFacultyWorkflowRole(role)) return { patient };
  if (patient.facultyCreatorId === userId) return { patient };
  return { error: 'forbidden' as const };
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
      notes: {
        select: {
          studentId: true,
          isSubmitted: true,
          submittedAt: true,
          feedback: true,
          grade: true,
        },
      },
    },
  });

  if (!patient) return { error: 'not_found' as const };
  if (!patient.facultyCreatorId) return { error: 'not_found' as const };
  if (isFacultyWorkflowRole(role)) return { patient };
  if (patient.facultyCreatorId === userId) return { patient };
  return { error: 'forbidden' as const };
}

router.use(authMiddleware);
router.use(facultyOrAdminMiddleware);

/** List student accounts (for assignment pickers). */
router.get('/students', async (req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, username: true, firstName: true, lastName: true, email: true, createdAt: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { username: 'asc' }],
    });

    const patientWhere = getFacultyPatientWhere(req.userId as string, req.userRole);

    const assignments = await prisma.caseAssignment.findMany({
      where: {
        patient: patientWhere,
      },
      select: { studentId: true },
    });

    const submittedNotes = await prisma.note.findMany({
      where: {
        isSubmitted: true,
        patient: patientWhere,
      },
      select: { studentId: true },
    });

    const assignmentCounts = new Map<string, number>();
    const submittedCounts = new Map<string, number>();

    for (const assignment of assignments) {
      assignmentCounts.set(
        assignment.studentId,
        (assignmentCounts.get(assignment.studentId) ?? 0) + 1
      );
    }

    for (const note of submittedNotes) {
      submittedCounts.set(note.studentId, (submittedCounts.get(note.studentId) ?? 0) + 1);
    }

    res.json({
      students: students.map((student) => {
        const assignmentCount = assignmentCounts.get(student.id) ?? 0;
        const submittedCount = submittedCounts.get(student.id) ?? 0;

        return {
          ...student,
          assignmentCount,
          submittedCount,
          pendingSubmissionCount: Math.max(assignmentCount - submittedCount, 0),
        };
      }),
    });
  } catch (error) {
    console.error('GET /api/faculty/students error:', error);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

/** Cases assigned to a specific student that this faculty member can manage. */
router.get('/students/:studentId/cases', async (req: Request, res: Response) => {
  try {
    const studentId = paramString(req.params.studentId).trim();
    if (!studentId) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true },
    });

    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const assignments = await prisma.caseAssignment.findMany({
      where: {
        studentId,
        patient: getFacultyPatientWhere(req.userId as string, req.userRole),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        assignedByFaculty: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const patientIds = assignments.map((assignment) => assignment.patientId);
    const notes =
      patientIds.length === 0
        ? []
        : await prisma.note.findMany({
            where: {
              studentId,
              patientId: { in: patientIds },
            },
            select: {
              id: true,
              patientId: true,
              isSubmitted: true,
              submittedAt: true,
              grade: true,
              feedback: true,
              createdAt: true,
              updatedAt: true,
            },
          });

    const noteByPatientId = new Map(notes.map((note) => [note.patientId, note]));

    res.json({
      student: {
        id: student.id,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      },
      cases: assignments.map((assignment) => {
        const note = noteByPatientId.get(assignment.patientId) ?? null;

        return {
          ...patientToCase(assignment.patient),
          assignmentId: assignment.id,
          assignedAt: assignment.createdAt,
          assignedByFaculty: assignment.assignedByFaculty,
          note: note
            ? {
                id: note.id,
                status: getNoteStatus(note),
                isSubmitted: note.isSubmitted,
                submittedAt: note.submittedAt,
                grade: note.grade,
                feedback: note.feedback,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error('GET /api/faculty/students/:studentId/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch student cases' });
  }
});

/** Cases visible in the collaborative faculty workflow. */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const where = getFacultyPatientWhere(req.userId as string, req.userRole);

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        assignments: {
          include: {
            student: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
          },
        },
        notes: {
          select: {
            studentId: true,
            isSubmitted: true,
            submittedAt: true,
            feedback: true,
            grade: true,
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
        totalNoteCount: p.notes.length,
        submittedNoteCount: p.notes.filter((note) => note.isSubmitted).length,
        pendingSubmissionCount: Math.max(
          p.assignments.length - p.notes.filter((note) => note.isSubmitted).length,
          0
        ),
        pendingReviewCount: p.notes.filter(
          (note) => note.isSubmitted && note.feedback === null && note.grade === null
        ).length,
        latestSubmittedAt:
          p.notes
            .filter((note) => note.submittedAt !== null)
            .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))[0]
            ?.submittedAt ?? null,
      })),
    });
  } catch (error) {
    console.error('GET /api/faculty/cases error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty cases' });
  }
});

/** Update a faculty-visible case without assigning it. */
router.patch('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const body = (req.body ?? {}) as {
      caseTitle?: unknown;
      name?: unknown;
      patient?: unknown;
      location?: unknown;
      dob?: unknown;
      gender?: unknown;
      codeStatus?: unknown;
      caseType?: unknown;
      hasLabs?: unknown;
    };

    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    const rawPatient = typeof body.patient === 'string' ? body.patient.trim() : '';
    const patientName = rawPatient || rawName;

    if (!patientName) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const location =
      typeof body.location === 'string' && body.location.trim() ? body.location.trim() : 'Unknown';
    const dob = typeof body.dob === 'string' ? new Date(body.dob) : new Date('2000-01-01');
    const gender =
      typeof body.gender === 'string' && body.gender.trim() ? body.gender.trim() : 'Unknown';
    const codeStatus =
      typeof body.codeStatus === 'string' && body.codeStatus.trim()
        ? body.codeStatus.trim()
        : 'Full Code';

    if (Number.isNaN(dob.getTime())) {
      res.status(400).json({ error: 'dob must be a valid date' });
      return;
    }

    const caseTitle = typeof body.caseTitle === 'string' ? body.caseTitle.trim() : rawName;
    const caseType = body.caseType === 'sim' ? 'sim' : 'pbl';
    const hasLabs = body.hasLabs === true || body.hasLabs === 'true';

    const updatedPatient = await prisma.patient.update({
      where: { id: caseId },
      data: {
        caseTitle: caseTitle || null,
        name: patientName,
        location,
        dob,
        gender,
        codeStatus,
        caseType,
        hasLabs,
      },
    });

    res.json({ case: patientToCase(updatedPatient) });
  } catch (error) {
    console.error('PATCH /api/faculty/cases/:id error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/** Notes for a faculty-visible case with student identity. */
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
      where: {
        patientId: caseId,
        isSubmitted: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
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

/** All lab assets for a faculty-visible case, including hidden items. */
router.get('/cases/:id/labs', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const labs = await prisma.caseLab.findMany({
      where: { patientId: caseId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        uploadedByFaculty: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({ labs: labs.map(caseLabToFacultyPayload) });
  } catch (error) {
    console.error('GET /api/faculty/cases/:id/labs error:', error);
    res.status(500).json({ error: 'Failed to fetch case labs' });
  }
});

/** Upload a lab or diagnostic file and decide whether students can see it yet. */
router.post(
  '/cases/:id/labs',
  labUpload.single('file'),
  async (req: Request, res: Response) => {
    const uploadedFile = (req as Request & { file?: UploadedFileLike }).file;

    try {
      const caseId = parseCaseId(paramString(req.params.id));
      if (!caseId) {
        cleanupUploadedLabFile(uploadedFile);
        res.status(400).json({ error: 'Invalid case id' });
        return;
      }

      const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
      if ('error' in access) {
        cleanupUploadedLabFile(uploadedFile);
        if (access.error === 'not_found') {
          res.status(404).json({ error: 'Case not found' });
          return;
        }

        res.status(403).json({ error: 'You do not have access to this case' });
        return;
      }

      if (!uploadedFile) {
        res.status(400).json({
          error: 'No lab file provided. Supported formats: PDF, images, CSV, TXT, XLS, XLSX.',
        });
        return;
      }

      if (!access.patient.hasLabs) {
        cleanupUploadedLabFile(uploadedFile);
        res.status(409).json({
          error: 'Case labs are disabled for this case. Turn on "Case with Labs" before uploading.',
        });
        return;
      }

      const body = (req.body ?? {}) as {
        title?: unknown;
        category?: unknown;
        description?: unknown;
        isVisibleToStudent?: unknown;
      };

      const fallbackTitle = path.parse(uploadedFile.originalname).name || uploadedFile.originalname;
      const title =
        typeof body.title === 'string' && body.title.trim()
          ? body.title.trim()
          : fallbackTitle;
      const category =
        typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null;
      const description =
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : null;
      const isVisibleToStudent = parseOptionalBoolean(body.isVisibleToStudent) ?? false;

      const createdLab = await prisma.caseLab.create({
        data: {
          patientId: caseId,
          title,
          category,
          description,
          originalFilename: uploadedFile.originalname,
          fileUrl: buildUploadUrl(uploadedFile),
          mimeType: uploadedFile.mimetype,
          isVisibleToStudent,
          uploadedByFacultyId: req.userId ?? null,
        },
        include: {
          uploadedByFaculty: {
            select: { id: true, username: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.status(201).json({ lab: caseLabToFacultyPayload(createdLab) });
    } catch (error) {
      cleanupUploadedLabFile(uploadedFile);
      console.error('POST /api/faculty/cases/:id/labs error:', error);
      res.status(500).json({ error: 'Failed to upload case lab' });
    }
  }
);

/** Hide or unhide a case lab for students. */
router.patch('/cases/:caseId/labs/:labId', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.caseId));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const labId = paramString(req.params.labId).trim();
    if (!labId) {
      res.status(400).json({ error: 'Invalid lab id' });
      return;
    }

    const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const body = (req.body ?? {}) as { isVisibleToStudent?: unknown };
    const isVisibleToStudent = parseOptionalBoolean(body.isVisibleToStudent);
    if (isVisibleToStudent === null) {
      res.status(400).json({ error: 'isVisibleToStudent must be true or false' });
      return;
    }

    const existingLab = await prisma.caseLab.findUnique({
      where: { id: labId },
      select: { id: true, patientId: true },
    });

    if (!existingLab || existingLab.patientId !== caseId) {
      res.status(404).json({ error: 'Case lab not found' });
      return;
    }

    const updatedLab = await prisma.caseLab.update({
      where: { id: labId },
      data: { isVisibleToStudent },
      include: {
        uploadedByFaculty: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({ lab: caseLabToFacultyPayload(updatedLab) });
  } catch (error) {
    console.error('PATCH /api/faculty/cases/:caseId/labs/:labId error:', error);
    res.status(500).json({ error: 'Failed to update case lab visibility' });
  }
});

/** Edit a lab's metadata and optionally replace its uploaded file. */
router.put(
  '/cases/:caseId/labs/:labId',
  labUpload.single('file'),
  async (req: Request, res: Response) => {
    const uploadedFile = (req as Request & { file?: UploadedFileLike }).file;

    try {
      const caseId = parseCaseId(paramString(req.params.caseId));
      if (!caseId) {
        res.status(400).json({ error: 'Invalid case id' });
        return;
      }

      const labId = paramString(req.params.labId).trim();
      if (!labId) {
        res.status(400).json({ error: 'Invalid lab id' });
        return;
      }

      const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
      if ('error' in access) {
        if (access.error === 'not_found') {
          res.status(404).json({ error: 'Case not found' });
          return;
        }

        res.status(403).json({ error: 'You do not have access to this case' });
        return;
      }

      const existingLab = await prisma.caseLab.findUnique({
        where: { id: labId },
        include: {
          uploadedByFaculty: {
            select: { id: true, username: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!existingLab || existingLab.patientId !== caseId) {
        res.status(404).json({ error: 'Case lab not found' });
        return;
      }

      const body = (req.body ?? {}) as {
        title?: unknown;
        category?: unknown;
        description?: unknown;
        isVisibleToStudent?: unknown;
      };

      const nextTitleInput = typeof body.title === 'string' ? body.title.trim() : '';
      const fallbackTitle =
        uploadedFile ? path.parse(uploadedFile.originalname).name || uploadedFile.originalname : '';
      const title = nextTitleInput || fallbackTitle || existingLab.title;

      if (!title) {
        res.status(400).json({ error: 'title is required' });
        return;
      }

      const category =
        typeof body.category === 'string'
          ? body.category.trim() || null
          : existingLab.category;
      const description =
        typeof body.description === 'string'
          ? body.description.trim() || null
          : existingLab.description;

      const visibilityProvided = Object.prototype.hasOwnProperty.call(body, 'isVisibleToStudent');
      const parsedVisibility = parseOptionalBoolean(body.isVisibleToStudent);
      if (visibilityProvided && parsedVisibility === null) {
        res.status(400).json({ error: 'isVisibleToStudent must be true or false' });
        return;
      }

      const updatedLab = await prisma.caseLab.update({
        where: { id: labId },
        data: {
          title,
          category,
          description,
          isVisibleToStudent: visibilityProvided
            ? (parsedVisibility as boolean)
            : existingLab.isVisibleToStudent,
          ...(uploadedFile
            ? {
                originalFilename: uploadedFile.originalname,
                fileUrl: buildUploadUrl(uploadedFile),
                mimeType: uploadedFile.mimetype,
                uploadedByFacultyId: req.userId ?? existingLab.uploadedByFacultyId,
              }
            : {}),
        },
        include: {
          uploadedByFaculty: {
            select: { id: true, username: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (uploadedFile && existingLab.fileUrl !== updatedLab.fileUrl) {
        deleteUploadFileIfExists(existingLab.fileUrl);
      }

      res.json({ lab: caseLabToFacultyPayload(updatedLab) });
    } catch (error) {
      if (uploadedFile) {
        deleteUploadFileIfExists(buildUploadUrl(uploadedFile));
      }
      console.error('PUT /api/faculty/cases/:caseId/labs/:labId error:', error);
      res.status(500).json({ error: 'Failed to update case lab' });
    }
  }
);

/** Permanently delete a lab from a faculty-visible case. */
router.delete('/cases/:caseId/labs/:labId', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.caseId));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const labId = paramString(req.params.labId).trim();
    if (!labId) {
      res.status(400).json({ error: 'Invalid lab id' });
      return;
    }

    const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const existingLab = await prisma.caseLab.findUnique({
      where: { id: labId },
      select: {
        id: true,
        patientId: true,
        title: true,
        fileUrl: true,
      },
    });

    if (!existingLab || existingLab.patientId !== caseId) {
      res.status(404).json({ error: 'Case lab not found' });
      return;
    }

      await prisma.caseLab.delete({
        where: { id: labId },
      });

    deleteUploadFileIfExists(existingLab.fileUrl);

    res.json({
      deletedLab: {
        id: existingLab.id,
        caseId,
        title: existingLab.title,
      },
    });
  } catch (error) {
    console.error('DELETE /api/faculty/cases/:caseId/labs/:labId error:', error);
    res.status(500).json({ error: 'Failed to delete case lab' });
  }
});

/** Permanently delete a faculty-visible case and its related records. */
router.delete('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseCaseId(paramString(req.params.id));
    if (!caseId) {
      res.status(400).json({ error: 'Invalid case id' });
      return;
    }

    const access = await assertFacultyCaseAccess(caseId, req.userId!, req.userRole);
    if ('error' in access) {
      if (access.error === 'not_found') {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      res.status(403).json({ error: 'You do not have access to this case' });
      return;
    }

    const patientWithFiles = await prisma.patient.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        name: true,
        caseTitle: true,
        profilePictureUrl: true,
        caseLabs: {
          select: {
            id: true,
            fileUrl: true,
          },
        },
      },
    });

    if (!patientWithFiles) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    await prisma.patient.delete({
      where: { id: caseId },
    });

    if (patientWithFiles.profilePictureUrl) {
      deleteUploadFileIfExists(patientWithFiles.profilePictureUrl);
    }

    for (const lab of patientWithFiles.caseLabs) {
      deleteUploadFileIfExists(lab.fileUrl);
    }

    res.json({
      deletedCase: {
        id: patientWithFiles.id,
        patient: patientWithFiles.name,
        name: patientWithFiles.caseTitle?.trim() ? patientWithFiles.caseTitle : patientWithFiles.name,
      },
    });
  } catch (error) {
    console.error('DELETE /api/faculty/cases/:id error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
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
    const submittedNotes = p.notes.filter((note) => note.isSubmitted);

    res.json({
      case: {
        ...patientToCase(p),
        chiefComplaints: p.chiefComplaints,
        notes: p.notes.map((note) => ({
          studentId: note.studentId,
          isSubmitted: note.isSubmitted,
          submittedAt: note.submittedAt,
        })),
        assignments: p.assignments.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          student: a.student,
          assignedByFacultyId: a.assignedByFacultyId,
          createdAt: a.createdAt,
        })),
        totalNoteCount: p.notes.length,
        submittedNoteCount: submittedNotes.length,
        pendingSubmissionCount: Math.max(p.assignments.length - submittedNotes.length, 0),
        pendingReviewCount: submittedNotes.filter(
          (note) => note.feedback === null && note.grade === null
        ).length,
        latestSubmittedAt:
          submittedNotes.sort(
            (a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0)
          )[0]?.submittedAt ?? null,
      },
    });
  } catch (error) {
    console.error('GET /api/faculty/cases/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

export default router;

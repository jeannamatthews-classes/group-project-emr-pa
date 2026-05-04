const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/auth', '')
  : 'http://localhost:5001';

export type FacultyReviewer = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type AssignedCase = {
  id: number;
  caseTitle: string | null;
  name: string;
  patientName?: string;
  displayTitle?: string;
  courseId: string | null;
  course?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  location: string;
  dob: string;
  gender: string;
  codeStatus: string;
  caseType: 'pbl' | 'sim';
  hasLabs: boolean;
  profilePictureUrl: string | null;
  assignedByFaculty?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

export type Assignment = {
  id: string;
  patientId: number;
  studentId: string;
  createdAt: string;
  patient: AssignedCase;
};

export type NoteData = {
  id: string;
  caseId: number;
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
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  reviewedByFacultyId: string | null;
  reviewedAt: string | null;
  reviewedByFaculty?: FacultyReviewer | null;
  createdAt: string;
  updatedAt: string;
};

export type GradeNote = NoteData & {
  patient: {
    id: number;
    caseTitle: string | null;
    name: string;
    patientName?: string;
    displayTitle?: string;
    courseId?: string | null;
    course?: {
      id: string;
      name: string;
      code: string | null;
    } | null;
  };
};

export type StudentCaseLab = {
  id: string;
  caseId: number;
  patientId: number;
  title: string;
  category: string | null;
  description: string | null;
  originalFilename: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveNotePayload = {
  caseId: number;
  hpi: string;
  exam: string;
  assessment?: string | null;
  treatmentPlan?: string | null;
  medications?: string | null;
  allergies?: string | null;
  familyHistory?: string | null;
  socialHistory?: string | null;
  procedures?: string | null;
  diagnosis?: string | null;
  labAndDiagnostics?: string | null;
  codingAndBilling?: string | null;
  learningIssues?: string | null;
};

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed');
  }
  return data as T;
}

export async function getStudentCases(token: string): Promise<{ assignments: Assignment[] }> {
  const res = await fetch(`${API_BASE}/api/student/cases`, {
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

/** Load existing note for a specific case (returns null if none yet) */
export async function getNote(
  token: string,
  caseId: number
): Promise<{ note: NoteData } | null> {
  const res = await fetch(`${API_BASE}/api/notes?caseId=${caseId}`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  const data = await parseResponse<{ note: NoteData | null }>(res);
  return data.note ? ({ note: data.note } as { note: NoteData }) : null;
}

export async function saveNote(
  token: string,
  payload: SaveNotePayload
): Promise<{ note: NoteData }> {
  const res = await fetch(`${API_BASE}/api/notes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function submitNote(
  token: string,
  noteId: string
): Promise<{ note: NoteData }> {
  const res = await fetch(`${API_BASE}/api/notes/${noteId}/submit`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

export async function getStudentGrades(token: string): Promise<{ notes: GradeNote[] }> {
  const res = await fetch(`${API_BASE}/api/student/grades`, {
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

/** Visible case labs released by faculty for the logged-in student */
export async function getStudentCaseLabs(
  token: string,
  caseId: number
): Promise<{ labs: StudentCaseLab[] }> {
  const res = await fetch(`${API_BASE}/api/student/cases/${caseId}/labs`, {
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

export async function uploadProfilePicture(
  token: string,
  caseId: number,
  file: File
): Promise<{ profilePictureUrl: string }> {
  const formData = new FormData();
  formData.append('picture', file);
  const res = await fetch(`${API_BASE}/api/cases/${caseId}/picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res);
}

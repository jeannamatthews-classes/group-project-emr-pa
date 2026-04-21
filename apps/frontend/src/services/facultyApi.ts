const AUTH_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/auth").replace(
  /\/+$/,
  ""
);

function resolveApiRoot(authBaseUrl: string): string {
  if (authBaseUrl.endsWith("/api/auth")) {
    return authBaseUrl.replace(/\/auth$/, "");
  }
  if (authBaseUrl.endsWith("/auth")) {
    return authBaseUrl.replace(/\/auth$/, "");
  }
  if (authBaseUrl.endsWith("/api")) {
    return authBaseUrl;
  }
  return `${authBaseUrl}/api`;
}

const API_ROOT = resolveApiRoot(AUTH_BASE_URL);
export const API_HOST = API_ROOT.replace(/\/api$/, "");
const FACULTY_BASE_URL = `${API_ROOT}/faculty`;
const ASSIGNMENTS_BASE_URL = `${API_ROOT}/assignments`;
const NOTES_BASE_URL = `${API_ROOT}/notes`;

type ApiErrorResponse = {
  error?: string;
  details?: string;
};

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorResponse;
  if (!response.ok) {
    const errorMessage =
      (data as ApiErrorResponse).error ||
      (data as ApiErrorResponse).details ||
      "Request failed";
    throw new Error(errorMessage);
  }
  return data as T;
}

export type FacultyStudent = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  createdAt: string;
  assignmentCount: number;
  submittedCount: number;
  pendingSubmissionCount: number;
};

export type FacultyCaseAssignment = {
  id: string;
  studentId: string;
  student: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
};

export type FacultyCase = {
  id: number;
  name: string;
  patient: string;
  caseTitle?: string | null;
  patientName?: string;
  displayTitle?: string;
  location: string;
  dob: string;
  gender: string;
  codeStatus: string;
  caseType: string;
  hasLabs: boolean;
  profilePictureUrl: string | null;
  assignments: FacultyCaseAssignment[];
  totalNoteCount: number;
  submittedNoteCount: number;
  pendingSubmissionCount: number;
  latestSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacultyCaseDetail = FacultyCase & {
  chiefComplaints: Array<{
    id: number;
    complaintText: string;
  }>;
  notes: Array<{
    studentId: string;
    isSubmitted: boolean;
    submittedAt: string | null;
  }>;
};

export type FacultyCaseNote = {
  id: string;
  caseId: number;
  studentId: string;
  student: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  hpi: string;
  medications: string | null;
  allergies: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  physicalExam: string;
  procedures: string | null;
  diagnosis: string | null;
  labAndDiagnostics: string | null;
  assessment: string | null;
  codingAndBilling: string | null;
  learningIssues: string | null;
  treatmentPlan: string | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacultyStudentCaseNoteSummary = {
  id: string;
  status: "draft" | "submitted" | "reviewed";
  isSubmitted: boolean;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacultyStudentCase = {
  id: number;
  name: string;
  patient: string;
  caseTitle?: string | null;
  patientName?: string;
  displayTitle?: string;
  location: string;
  dob: string;
  gender: string;
  codeStatus: string;
  caseType: string;
  hasLabs: boolean;
  profilePictureUrl: string | null;
  assignmentId: string;
  assignedAt: string;
  assignedByFaculty: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  note: FacultyStudentCaseNoteSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type FacultyCaseLab = {
  id: string;
  caseId: number;
  patientId: number;
  title: string;
  category: string | null;
  description: string | null;
  originalFilename: string;
  fileUrl: string;
  mimeType: string;
  isVisibleToStudent: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedByFaculty: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

export async function facultyListStudents(token: string): Promise<{ students: FacultyStudent[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/students`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return parseResponse<{ students: FacultyStudent[] }>(response);
}

export async function facultyListCases(token: string): Promise<{ cases: FacultyCase[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return parseResponse<{ cases: FacultyCase[] }>(response);
}

export async function facultyGetCase(token: string, caseId: number): Promise<{ case: FacultyCaseDetail }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return parseResponse<{ case: FacultyCaseDetail }>(response);
}

export async function facultyListStudentCases(
  token: string,
  studentId: string
): Promise<{
  student: { id: string; username: string; firstName: string | null; lastName: string | null; email: string };
  cases: FacultyStudentCase[];
}> {
  const response = await fetch(
    `${FACULTY_BASE_URL}/students/${encodeURIComponent(studentId)}/cases`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );
  return parseResponse<{
    student: { id: string; username: string; firstName: string | null; lastName: string | null; email: string };
    cases: FacultyStudentCase[];
  }>(response);
}

export async function facultyListCaseNotes(token: string, caseId: number): Promise<{ notes: FacultyCaseNote[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/notes`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return parseResponse<{ notes: FacultyCaseNote[] }>(response);
}

export async function facultyListCaseLabs(token: string, caseId: number): Promise<{ labs: FacultyCaseLab[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/labs`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return parseResponse<{ labs: FacultyCaseLab[] }>(response);
}

export async function facultyCreateCase(
  token: string,
  payload: {
    name: string;
    caseTitle?: string;
    location?: string;
    dob?: string;
    gender?: string;
    codeStatus?: string;
    caseType?: string;
    hasLabs?: boolean;
  }
): Promise<{ case: { id: number } }> {
  const response = await fetch(`${API_ROOT}/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ case: { id: number } }>(response);
}

export async function facultyUpdateCase(
  token: string,
  caseId: number,
  payload: {
    name: string;
    caseTitle?: string;
    location?: string;
    dob?: string;
    gender?: string;
    codeStatus?: string;
    caseType?: string;
    hasLabs?: boolean;
  }
): Promise<{ case: FacultyCase }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ case: FacultyCase }>(response);
}

export async function facultyUploadCasePicture(
  token: string,
  caseId: number,
  file: File
): Promise<{ profilePictureUrl: string }> {
  const formData = new FormData();
  formData.append("picture", file);
  const response = await fetch(`${API_ROOT}/cases/${caseId}/picture`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return parseResponse<{ profilePictureUrl: string }>(response);
}

export async function facultyUploadCaseLab(
  token: string,
  caseId: number,
  payload: {
    title: string;
    category?: string;
    description?: string;
    isVisibleToStudent?: boolean;
    file: File;
  }
): Promise<{ lab: FacultyCaseLab }> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("title", payload.title);
  if (payload.category) {
    formData.append("category", payload.category);
  }
  if (payload.description) {
    formData.append("description", payload.description);
  }
  formData.append("isVisibleToStudent", String(payload.isVisibleToStudent ?? false));

  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/labs`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return parseResponse<{ lab: FacultyCaseLab }>(response);
}

export async function facultyAssignCase(
  token: string,
  payload: { patientId: number; studentId: string }
): Promise<{ assignment: unknown }> {
  const response = await fetch(ASSIGNMENTS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ assignment: unknown }>(response);
}

export async function facultyUnassignCase(
  token: string,
  assignmentId: string
): Promise<{
  assignment: {
    id: string;
    patientId: number;
    studentId: string;
    patient: { id: number; name: string; caseTitle: string | null };
    student: { id: string; username: string; email: string };
  };
  deletedNote: boolean;
}> {
  const response = await fetch(`${ASSIGNMENTS_BASE_URL}/${encodeURIComponent(assignmentId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return parseResponse<{
    assignment: {
      id: string;
      patientId: number;
      studentId: string;
      patient: { id: number; name: string; caseTitle: string | null };
      student: { id: string; username: string; email: string };
    };
    deletedNote: boolean;
  }>(response);
}

export async function facultyDeleteCase(
  token: string,
  caseId: number
): Promise<{
  deletedCase: {
    id: number;
    patient: string;
    name: string;
  };
}> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return parseResponse<{
    deletedCase: {
      id: number;
      patient: string;
      name: string;
    };
  }>(response);
}

export async function facultySaveNoteFeedback(
  token: string,
  noteId: string,
  payload: {
    feedback?: string;
    grade?: number | null;
  }
): Promise<{ note: FacultyCaseNote }> {
  const response = await fetch(`${NOTES_BASE_URL}/${encodeURIComponent(noteId)}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ note: FacultyCaseNote }>(response);
}

export async function facultySetCaseLabVisibility(
  token: string,
  caseId: number,
  labId: string,
  isVisibleToStudent: boolean
): Promise<{ lab: FacultyCaseLab }> {
  const response = await fetch(
    `${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/labs/${encodeURIComponent(labId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ isVisibleToStudent }),
    }
  );
  return parseResponse<{ lab: FacultyCaseLab }>(response);
}

export async function facultyDeleteCaseLab(
  token: string,
  caseId: number,
  labId: string
): Promise<{
  deletedLab: {
    id: string;
    caseId: number;
    title: string;
  };
}> {
  const response = await fetch(
    `${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/labs/${encodeURIComponent(labId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );
  return parseResponse<{
    deletedLab: {
      id: string;
      caseId: number;
      title: string;
    };
  }>(response);
}

export async function facultyUpdateCaseLab(
  token: string,
  caseId: number,
  labId: string,
  payload: {
    title?: string;
    category?: string;
    description?: string;
    isVisibleToStudent?: boolean;
    file?: File | null;
  }
): Promise<{ lab: FacultyCaseLab }> {
  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append("title", payload.title);
  }
  if (payload.category !== undefined) {
    formData.append("category", payload.category);
  }
  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  if (payload.isVisibleToStudent !== undefined) {
    formData.append("isVisibleToStudent", String(payload.isVisibleToStudent));
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await fetch(
    `${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/labs/${encodeURIComponent(labId)}`,
    {
      method: "PUT",
      headers: authHeaders(token),
      body: formData,
    }
  );
  return parseResponse<{ lab: FacultyCaseLab }>(response);
}

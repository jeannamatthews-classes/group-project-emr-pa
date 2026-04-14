const AUTH_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/auth").replace(/\/+$/, "");

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

const FACULTY_BASE_URL = `${resolveApiRoot(AUTH_BASE_URL)}/faculty`;
const ASSIGNMENTS_BASE_URL = `${resolveApiRoot(AUTH_BASE_URL)}/assignments`;

type ApiErrorResponse = {
  error?: string;
  details?: string;
};

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
  email: string;
  createdAt: string;
};

export type FacultyCaseAssignment = {
  id: string;
  studentId: string;
  student: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
};

export type FacultyCase = {
  id: number;
  name: string;
  patient: string;
  location: string;
  dob: string;
  gender: string;
  codeStatus: string;
  caseType?: string;
  hasLabs?: boolean;
  profilePictureUrl?: string | null;
  assignments: FacultyCaseAssignment[];
  createdAt: string;
  updatedAt: string;
};

export type FacultyCaseNote = {
  id: string;
  caseId: number;
  studentId: string;
  student: {
    id: string;
    username: string;
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

export async function facultyListStudents(token: string): Promise<{ students: FacultyStudent[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/students`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseResponse<{ students: FacultyStudent[] }>(response);
}

export async function facultyListCases(token: string): Promise<{ cases: FacultyCase[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseResponse<{ cases: FacultyCase[] }>(response);
}

export async function facultyGetCase(token: string, caseId: number): Promise<{ case: FacultyCase }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseResponse<{ case: FacultyCase }>(response);
}

export async function facultyListCaseNotes(token: string, caseId: number): Promise<{ notes: FacultyCaseNote[] }> {
  const response = await fetch(`${FACULTY_BASE_URL}/cases/${encodeURIComponent(String(caseId))}/notes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseResponse<{ notes: FacultyCaseNote[] }>(response);
}

export async function facultyAssignCase(
  token: string,
  payload: { patientId: number; studentId: string }
): Promise<{ assignment: unknown }> {
  const response = await fetch(ASSIGNMENTS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ assignment: unknown }>(response);
}

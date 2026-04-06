const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/auth';
const AUTH_BASE_URL = API_BASE_URL.replace(/\/+$/, "");

function resolveAdminBaseUrl(authBaseUrl: string): string {
    if (authBaseUrl.endsWith("/api/auth")) {
        return authBaseUrl.replace(/\/auth$/, "/admin");
    }
    if (authBaseUrl.endsWith("/auth")) {
        return authBaseUrl.replace(/\/auth$/, "/admin");
    }
    if (authBaseUrl.endsWith("/api")) {
        return `${authBaseUrl}/admin`;
    }
    return `${authBaseUrl}/api/admin`;
}

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
const AUTH_ENDPOINTS = {
    login: "/login",
    register: "/register",
    me: "/me"
} as const;


type AuthUser = {
    id: string;
    username: string;
    email: string;
    role: "admin" | "faculty" | "student" | "unassigned";
};

type LoginInput = {
    email: string;
    password: string;
};

type RegisterInput = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type AuthSuccessResponse = {
    message?: string;
    user: AuthUser;
    token?: string;
};

type MeResponse = {
    user: AuthUser;
};

type ApiErrorResponse = {
    error?: string;
    details?: string;
};


async function parseResponse<T>(response: Response): Promise<T> {
    const data = (await response.json()) as T | ApiErrorResponse;

    if (!response.ok){
        const errorMessage = 
        (data as ApiErrorResponse).error ||
        (data as ApiErrorResponse).details ||
        "Request failed";
        throw new Error(errorMessage)
    }
    return data as T;
}



export async function loginUser(payload: LoginInput): Promise<AuthSuccessResponse>{
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.login, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<AuthSuccessResponse>(response);
}


export async function registerUser(payload: RegisterInput): Promise<AuthSuccessResponse>{
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.register, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<AuthSuccessResponse>(response);
}


export async function getMe(token: string): Promise<MeResponse>{
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.me, {
        method: "GET",
        headers:{
            Authorization: "Bearer " + token,
        },
    });
    return parseResponse<MeResponse>(response);
}


function normalizeApiError(error: unknown): Error{
    if (error instanceof Error){
        const cleanedMessage = error.message.trim();
        if(cleanedMessage.length > 0){
            return new Error(cleanedMessage);
        }
        return new Error("Something went wrong. Please try again.")
    }
    return new Error("Unexpected error. Please try again.")
}




export type {
  AuthUser,
  LoginInput,
  RegisterInput,
  AuthSuccessResponse,
  MeResponse,
  ApiErrorResponse,
};

export {
  parseResponse,
  normalizeApiError,
};


type LogoutOptions = {
  clearStorage?: boolean;
  storageKey?: string;
};

export function logout(options: LogoutOptions = {}): void {
  const { clearStorage = true, storageKey = "auth_token" } = options;

  if (clearStorage) {
    localStorage.removeItem(storageKey);
  }
}

export function getStoredToken(storageKey = "auth_token"): string | null {
  return localStorage.getItem(storageKey);
}

export function setStoredToken(token: string, storageKey = "auth_token"): void {
  localStorage.setItem(storageKey, token);
}

export async function refreshAccessToken(): Promise<void> {
  throw new Error("refreshAccessToken is not implemented yet.");
}

export type AdminUserListItem = {
    id: string;
    username: string;
    email: string;
    role: "admin" | "faculty" | "student" | "unassigned";
    createdAt: string;
};

export type AdminRole = AdminUserListItem["role"];

export type AdminLogItem = {
    id: string;
    eventType: string;
    message: string;
    actorUserId: string | null;
    targetUserId: string | null;
    metadata: unknown;
    createdAt: string;
};

const ADMIN_BASE_URL = resolveAdminBaseUrl(AUTH_BASE_URL);
const API_ROOT = resolveApiRoot(AUTH_BASE_URL);
const CASES_BASE_URL = `${API_ROOT}/cases`;
const NOTES_BASE_URL = `${API_ROOT}/notes`;

export type StudentCaseItem = {
    id: number;
    name: string;
    patient: string;
    location?: string;
    dob?: string;
    gender?: string;
    codeStatus?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type StudentNoteItem = {
    id: string;
    caseId: number;
    hpi: string;
    physicalExam: string;
    assess?: string;
    treat?: string;
    feedback: string | null;
    createdAt: string;
    updatedAt: string;
};

export async function studentListCases(token: string): Promise<{ cases: StudentCaseItem[] }> {
    const response = await fetch(CASES_BASE_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return parseResponse<{ cases: StudentCaseItem[] }>(response);
}

export async function studentCreateCase(
    token: string,
    payload: {
        name: string;
        patient: string;
        location?: string;
        dob?: string;
        gender?: string;
        codeStatus?: string;
    }
): Promise<{ case: StudentCaseItem }> {
    const response = await fetch(CASES_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<{ case: StudentCaseItem }>(response);
}

export async function studentGetMyNoteForCase(token: string, caseId: number): Promise<{ note: StudentNoteItem }> {
    const response = await fetch(`${NOTES_BASE_URL}?caseId=${encodeURIComponent(String(caseId))}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return parseResponse<{ note: StudentNoteItem }>(response);
}

export async function studentSaveNote(
    token: string,
    payload: { caseId: number; hpi: string; exam: string; assess?: string; treat?: string }
): Promise<{ note: StudentNoteItem }> {
    const response = await fetch(NOTES_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<{ note: StudentNoteItem }>(response);
}

export async function adminListUsers(token: string): Promise<{ users: AdminUserListItem[]; total: number }> {
    const response = await fetch(`${ADMIN_BASE_URL}/users`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return parseResponse<{ users: AdminUserListItem[]; total: number }>(response);
}

export async function adminDeleteUser(token: string, userId: string): Promise<{ message: string; deletedUserId: string }> {
    const response = await fetch(`${ADMIN_BASE_URL}/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return parseResponse<{ message: string; deletedUserId: string }>(response);
}

export async function adminUpdateUserRole(
    token: string,
    userId: string,
    role: AdminRole
): Promise<{ message: string; user: AdminUserListItem }> {
    const response = await fetch(`${ADMIN_BASE_URL}/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
    });
    return parseResponse<{ message: string; user: AdminUserListItem }>(response);
}

export async function adminGetLogs(token: string): Promise<{ logs: AdminLogItem[]; total: number }> {
    const response = await fetch(`${ADMIN_BASE_URL}/logs`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return parseResponse<{ logs: AdminLogItem[]; total: number }>(response);
}

export async function adminResetUserPassword(
    token: string,
    userId: string,
    newPassword: string
): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_BASE_URL}/users/${encodeURIComponent(userId)}/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
    });
    return parseResponse<{ message: string }>(response);
}
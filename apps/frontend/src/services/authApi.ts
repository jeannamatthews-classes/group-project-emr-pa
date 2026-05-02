const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/auth';
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
    me: "/me",
    verifyEmailCode: "/verify-email-code",
    resendEmailCode: "/resend-email-code",
} as const;


type AuthUser = {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: "admin" | "faculty" | "student" | "unassigned";
};

type LoginInput = {
    email: string;
    password: string;
};

type RegisterInput = {
    username: string;
    firstName: string;
    lastName: string;
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

type UpdateProfileInput = {
    firstName: string;
    lastName: string;
};

type ApiErrorResponse = {
    error?: string;
    details?: string;
    code?: string;
    requiresEmailVerification?: boolean;
};

class ApiError extends Error {
    code?: string;
    requiresEmailVerification?: boolean;

    constructor(
        message: string,
        options: {
            code?: string;
            requiresEmailVerification?: boolean;
        } = {}
    ) {
        super(message);
        this.name = "ApiError";
        this.code = options.code;
        this.requiresEmailVerification = options.requiresEmailVerification;
    }
}

async function parseResponse<T>(response: Response): Promise<T> {
    const data = (await response.json()) as T | ApiErrorResponse;

    if (!response.ok){
        const errorMessage = 
        (data as ApiErrorResponse).error ||
        (data as ApiErrorResponse).details ||
        "Request failed";
        throw new ApiError(errorMessage, {
            code: (data as ApiErrorResponse).code,
            requiresEmailVerification: (data as ApiErrorResponse).requiresEmailVerification,
        });
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

export async function verifyEmailCode(payload: {
    email: string;
    code: string;
}): Promise<AuthSuccessResponse> {
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.verifyEmailCode, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<AuthSuccessResponse>(response);
}

export async function resendEmailCode(payload: { email: string }): Promise<{ message: string }> {
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.resendEmailCode, {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<{ message: string }>(response);
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

export async function updateMyProfile(token: string, payload: UpdateProfileInput): Promise<{
  message: string;
  user: AuthUser & { createdAt: string };
}> {
    const response = await fetch(AUTH_BASE_URL+AUTH_ENDPOINTS.me, {
        method: "PATCH",
        headers:{
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function changeMyPassword(
  token: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
    const response = await fetch(AUTH_BASE_URL+"/change-password", {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
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
  UpdateProfileInput,
  AuthSuccessResponse,
  MeResponse,
  ApiErrorResponse,
};

export {
  ApiError,
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

function getApiHost(): string {
  return AUTH_BASE_URL.replace(/\/api\/auth\/?$/, "").replace(/\/api\/?$/, "");
}

export function resolveAssetUrl(fileUrl: string | null | undefined): string {
  if (!fileUrl) return "";

  if (/^(?:blob:|data:|https?:\/\/)/i.test(fileUrl)) {
    return fileUrl;
  }

  const normalizedPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${getApiHost()}${normalizedPath}`;
}

export function isProtectedAssetUrl(fileUrl: string | null | undefined): boolean {
  if (!fileUrl) return false;
  if (/^(?:blob:|data:)/i.test(fileUrl)) return false;

  try {
    return new URL(resolveAssetUrl(fileUrl)).pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}

async function parseAssetError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as ApiErrorResponse;
    return data.error || data.details || "Failed to load file";
  }

  const message = (await response.text()).trim();
  return message || "Failed to load file";
}

export async function fetchAuthenticatedAssetBlob(
  fileUrl: string,
  signal?: AbortSignal
): Promise<Blob> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(resolveAssetUrl(fileUrl), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseAssetError(response));
  }

  return response.blob();
}

export async function openAuthenticatedAsset(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) {
    throw new Error("File URL is missing.");
  }

  const blob = await fetchAuthenticatedAssetBlob(fileUrl);
  const objectUrl = URL.createObjectURL(blob);
  const popup = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!popup) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export function buildAuthenticatedAssetUrl(fileUrl: string | null | undefined): string {
  return resolveAssetUrl(fileUrl);
}

export function getDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.username && user.username.trim()) return user.username;
  if (user.email && user.email.trim()) return user.email;
  return "Unknown user";
}

export async function refreshAccessToken(): Promise<void> {
  throw new Error("refreshAccessToken is not implemented yet.");
}

export type AdminUserListItem = {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
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
    assessment?: string;
    treatmentPlan?: string;
    /** @deprecated kept for backwards compat; assessment/treatmentPlan are the real fields now */
    assess?: string;
    /** @deprecated kept for backwards compat */
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
    payload: { caseId: number; hpi: string; exam: string; assessment?: string; treatmentPlan?: string }
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

export async function adminChangeOwnPassword(
    token: string,
    payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
    const response = await fetch(`${ADMIN_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return parseResponse<{ message: string }>(response);
}

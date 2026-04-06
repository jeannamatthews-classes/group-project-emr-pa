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
const AUTH_ENDPOINTS = {
    login: "/login",
    register: "/register",
    me: "/me"
} as const;


type AuthUser = {
    id: string;
    username: string;
    email: string;
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
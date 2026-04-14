export type UserRole = 'admin' | 'faculty' | 'student' | 'unassigned';

export type AdminUserListItem = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

export type AdminUsersResponse = {
  users: AdminUserListItem[];
  total: number;
};

export type AdminDeleteUserResponse = {
  message: string;
  deletedUserId: string;
};

export type AdminUpdateUserRoleResponse = {
  message: string;
  user: AdminUserListItem;
};

export type AuditEventType =
  | 'USER_REGISTERED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'ADMIN_PASSWORD_CHANGED';

export type AdminLogItem = {
  id: string;
  eventType: AuditEventType;
  message: string;
  actorUserId: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type AdminLogsResponse = {
  logs: AdminLogItem[];
  total: number;
};

export type AdminApiError = {
  error: string;
  details?: string;
};

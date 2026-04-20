import type { AdminNavItem, LogEntry, SettingItem, UserRow } from "./types";

export const adminNavItems: AdminNavItem[] = [
  { label: "User Management", path: "/admin/users" },
  { label: "System Logs", path: "/admin/logs" },
  { label: "Settings", path: "/admin/settings" },
];

export const userRows: UserRow[] = [
  {
    id: "29384",
    name: "Aniekan",
    email: "aniekan@clarkson.edu",
    role: "STUDENT",
    joinedDate: "Mar 29, 2026",
  },
  {
    id: "10293",
    name: "Elena",
    email: "elena@clarkson.edu",
    role: "FACULTY",
    joinedDate: "Mar 29, 2026",
  },
  {
    id: "412",
    name: "Gavin",
    email: "gavin@clarkson.edu",
    role: "FACULTY",
    joinedDate: "Mar 29, 2026",
  },
  {
    id: "33412",
    name: "Natalie",
    email: "natalie@clarkson.edu",
    role: "ADMIN",
    joinedDate: "Mar 29, 2026",
  },
  {
    id: "44821",
    name: "Jason",
    email: "jason@clarkson.edu",
    role: "UNASSIGNED",
    joinedDate: "Mar 29, 2026",
  },
];

export const recentLogs: LogEntry[] = [
  {
    id: "log-2011",
    level: "INFO",
    source: "AuthService",
    message: "Admin user signed in successfully.",
    timestamp: "2026-03-29 09:12",
  },
  {
    id: "log-2012",
    level: "WARN",
    source: "PermissionGuard",
    message: "Role update attempted without instructor scope.",
    timestamp: "2026-03-29 09:17",
  },
  {
    id: "log-2013",
    level: "ERROR",
    source: "AuditWriter",
    message: "Audit event queue timed out after 3 retries.",
    timestamp: "2026-03-29 09:23",
  },
];

export const settingItems: SettingItem[] = [
  {
    id: "session-timeout",
    label: "Idle Session Timeout",
    description: "Automatically sign out inactive administrators after 20 minutes.",
    enabled: true,
  },
  {
    id: "log-alerts",
    label: "Critical Log Alerts",
    description: "Send email alert when a critical security or access error is detected.",
    enabled: true,
  },
  {
    id: "maintenance-banner",
    label: "Maintenance Banner",
    description: "Display a banner to all users about upcoming maintenance windows.",
    enabled: false,
  },
];

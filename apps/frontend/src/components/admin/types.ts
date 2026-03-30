export type AdminNavItem = {
  label: string;
  path: string;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN" | "UNASSIGNED";
  joinedDate: string;
};

export type LogEntry = {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
  timestamp: string;
};

export type SettingItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

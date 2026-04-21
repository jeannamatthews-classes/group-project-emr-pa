import type { FacultyStudentCase } from "../../services/facultyApi";

export function getStudentCaseStatusTone(
  note: FacultyStudentCase["note"]
): { label: string; color: "default" | "warning" | "info" | "success" } {
  if (!note) {
    return { label: "Not started", color: "default" };
  }

  if (note.status === "reviewed") {
    return { label: "Reviewed", color: "success" };
  }

  if (note.status === "submitted") {
    return { label: "Submitted", color: "info" };
  }

  return { label: "Draft saved", color: "warning" };
}

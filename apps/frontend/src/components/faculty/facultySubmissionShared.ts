import { buildAuthenticatedAssetUrl } from "../../services/authApi";
import type { FacultyCaseLab } from "../../services/facultyApi";

export type FacultyNoteSectionKey =
  | "hpi"
  | "medications"
  | "allergies"
  | "familyHistory"
  | "socialHistory"
  | "physicalExam"
  | "procedures"
  | "diagnosis"
  | "labAndDiagnostics"
  | "assessment"
  | "treatmentPlan"
  | "codingAndBilling"
  | "learningIssues";

export const NOTE_SECTIONS: Array<{ key: FacultyNoteSectionKey; label: string }> = [
  { key: "hpi", label: "HPI" },
  { key: "medications", label: "Medications" },
  { key: "allergies", label: "Allergies" },
  { key: "familyHistory", label: "Family History" },
  { key: "socialHistory", label: "Social History" },
  { key: "physicalExam", label: "Physical Exam" },
  { key: "procedures", label: "Procedures" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "labAndDiagnostics", label: "Labs & Diagnostics" },
  { key: "assessment", label: "Assessment" },
  { key: "treatmentPlan", label: "Treatment Plan" },
  { key: "codingAndBilling", label: "Coding & Billing" },
  { key: "learningIssues", label: "Learning Issues" },
];

export const LAB_FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt,.xls,.xlsx";

export type LabEditFormState = {
  title: string;
  category: string;
  description: string;
  isVisibleToStudent: boolean;
};

export function formatSubmissionDate(value: string | null): string {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

export function displaySubmissionSectionValue(value: string | null): string {
  return value && value.trim() ? value : "Not provided.";
}

export function resolveFacultyAssetUrl(fileUrl: string | null | undefined): string {
  return buildAuthenticatedAssetUrl(fileUrl);
}

export function isImageLab(lab: Pick<FacultyCaseLab, "mimeType">): boolean {
  return lab.mimeType.startsWith("image/");
}

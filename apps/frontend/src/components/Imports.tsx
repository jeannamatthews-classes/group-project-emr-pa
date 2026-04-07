export type Student = {
  id: number;
  name: string;
};

export type Case = {
  id: number;
  title: string;
  patient: string;
};

export type AssignedCase = {
  id: number;
  caseId: number;
  studentId: number;
}

export const mockStudents: Student[] = [
  { id: 1, name: "Ricky Bobby" },
  { id: 2, name: "Forrest Gump" },
];

export const mockCases: Case[] = [
  { id: 1, title: "Chest Pain", patient: "John Doe" },
  { id: 2, title: "Bones Itchy", patient: "Jane Smith" },
];

export const mockAssignedCases: AssignedCase[] = [
  { id: 1, caseId: 1, studentId: 1 },
  { id: 2, caseId: 1, studentId: 2 },
  { id: 3, caseId: 2, studentId: 2 },
];

export const panelStyle = {
  bgcolor: "#ffffff",
  borderRadius: 3,
  p: 2.5,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  flex: 1,
  display: "flex",
  flexDirection: "column"
};
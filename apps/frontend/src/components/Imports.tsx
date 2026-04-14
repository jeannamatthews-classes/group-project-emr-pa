export type Student = {
  id: number;
  name: string;
};

export type Case = {
  id: number;
  title: string;
  patient: string;
  description: string;
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
  { id: 1, title: "Chest Pain", patient: "John Doe",
    description: "A 55-year-old male presents with severe chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF. Troponin levels are elevated."
   },
  { id: 2, title: "Bones Itchy", patient: "Jane Smith", description: "Patient reports itchy bones and joint pain."  },
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

export type StudentResponse = {
  id: number;
  caseId: number;
  studentId: number;
  hpi: string;
  history: {
    medical: string;
    family: string;
    social: string;
  }
  medications: string;
  allergies: string;
  ros: string;
  exam: string;
  procedures: string;
  diagnostics: string;
  assessment: string;
  treatment: string;
  codingBilling: string;
  notes: string;
};

export const mockStudentResponses: StudentResponse[] = [
  {
    id: 1,
    caseId: 1,
    studentId: 1,
    hpi: "History of present illness goes here",
    history: {
      medical: " ",
      family: " ",
      social: " "
    },
    medications: "This would usually be a list of meds",
    allergies: "Allergies would be listed here",
    ros: "I don't know what a review of systems is because I am not a medical professional",
    exam: "Physical exam findings would be documented here",
    procedures: "I'm getting bored of typing out these fields",
    diagnostics: "dfjkgbdf",
    assessment: "kjegebag",
    treatment: "Euthanization, immediately",
    codingBilling: "Billing code",
    notes: "Notes"
  },

  {
    id: 2,
    caseId: 1,
    studentId: 2,
    hpi: "History of present illness goes here",
    history: {
      medical: " ",
      family: " ",
      social: " "
    },
    medications: "This would usually be a list of meds",
    allergies: "Allergies would be listed here",
    ros: "I don't know what a review of systems is because I am not a medical professional",
    exam: "Physical exam findings would be documented here",
    procedures: "I'm getting bored of typing out these fields",
    diagnostics: "dfjkgbdf",
    assessment: "kjegebag",
    treatment: "Euthanization, immediately",
    codingBilling: "Billing code",
    notes: "Notes"
  },

  {
    id: 3,
    caseId: 2,
    studentId: 2,
    hpi: "History of present illness goes here",
    history: {
      medical: " ",
      family: " ",
      social: " "
    },
    medications: "This would usually be a list of meds",
    allergies: "Allergies would be listed here",
    ros: "I don't know what a review of systems is because I am not a medical professional",
    exam: "Physical exam findings would be documented here",
    procedures: "I'm getting bored of typing out these fields",
    diagnostics: "dfjkgbdf",
    assessment: "kjegebag",
    treatment: "Euthanization, immediately",
    codingBilling: "Billing code",
    notes: "Notes"
  }
];
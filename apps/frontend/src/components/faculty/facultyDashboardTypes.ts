export type FacultyCaseFormState = {
  name: string;
  chiefComplaint: string;
  dob: string;
  gender: string;
  codeStatus: string;
  location: string;
  caseType: string;
  hasLabs: boolean;
};

export const DEFAULT_FACULTY_CASE_FORM: FacultyCaseFormState = {
  name: "",
  chiefComplaint: "",
  dob: "",
  gender: "Other",
  codeStatus: "Full Code",
  location: "",
  caseType: "pbl",
  hasLabs: false,
};

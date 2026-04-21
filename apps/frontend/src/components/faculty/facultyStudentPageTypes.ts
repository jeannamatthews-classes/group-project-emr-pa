export type CaseActionDialogState =
  | {
      mode: "unassign";
      assignmentId: string;
      caseId: number;
      patientName: string;
      caseName: string;
    }
  | {
      mode: "delete";
      caseId: number;
      patientName: string;
      caseName: string;
    };

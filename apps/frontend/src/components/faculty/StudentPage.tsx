import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import { getDisplayName, getMe, getStoredToken, logout } from "../../services/authApi";
import {
  facultyAssignCase,
  facultyCreateCase,
  facultyDeleteCase,
  facultyListCases,
  facultyListStudentCases,
  facultyListStudents,
  facultyUnassignCase,
  facultyUploadCasePicture,
  type FacultyCase,
  type FacultyStudent,
  type FacultyStudentCase,
} from "../../services/facultyApi";
import FacultyAssignedCasesCard from "./FacultyAssignedCasesCard";
import FacultyAvailableCasesCard from "./FacultyAvailableCasesCard";
import FacultyCaseActionDialog from "./FacultyCaseActionDialog";
import FacultyCreateAssignCaseDialog from "./FacultyCreateAssignCaseDialog";
import FacultyPageTopBar from "./FacultyPageTopBar";
import FacultyStudentSidebar from "./FacultyStudentSidebar";
import {
  DEFAULT_FACULTY_CASE_FORM,
  type FacultyCaseFormState,
} from "./facultyDashboardTypes";
import type { CaseActionDialogState } from "./facultyStudentPageTypes";

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [facultyCases, setFacultyCases] = useState<FacultyCase[]>([]);
  const [studentCases, setStudentCases] = useState<FacultyStudentCase[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [assignedCaseSearch, setAssignedCaseSearch] = useState("");
  const [availableCaseSearch, setAvailableCaseSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentCasesLoading, setStudentCasesLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assigningCaseId, setAssigningCaseId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<CaseActionDialogState | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [submittingNewCase, setSubmittingNewCase] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [newCaseForm, setNewCaseForm] = useState<FacultyCaseFormState>(DEFAULT_FACULTY_CASE_FORM);

  useEffect(() => {
    let active = true;

    async function loadFacultyData() {
      const token = getStoredToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setPageError("You are not logged in.");
        return;
      }

      try {
        const [{ students: nextStudents }, { cases: nextCases }, me] = await Promise.all([
          facultyListStudents(token),
          facultyListCases(token),
          getMe(token),
        ]);

        if (!active) return;
        setStudents(nextStudents);
        setFacultyCases(nextCases);
        setIsAdmin(me.user.role === "admin");
        setPageError(null);
      } catch (error) {
        if (!active) return;
        setPageError(error instanceof Error ? error.message : "Failed to load faculty data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFacultyData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStudentCases() {
      if (!studentId) {
        if (active) {
          setStudentCases([]);
          setStudentCasesLoading(false);
        }
        return;
      }

      const token = getStoredToken();
      if (!token) {
        if (!active) return;
        setStudentCases([]);
        setStudentCasesLoading(false);
        return;
      }

      setStudentCasesLoading(true);
      try {
        const { cases: nextCases } = await facultyListStudentCases(token, studentId);
        if (!active) return;
        setStudentCases(nextCases);
        setActionError(null);
      } catch (error) {
        if (!active) return;
        setStudentCases([]);
        setActionError(error instanceof Error ? error.message : "Failed to load student cases.");
      } finally {
        if (active) {
          setStudentCasesLoading(false);
        }
      }
    }

    void loadStudentCases();
    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    setActionMessage(null);
    setActionError(null);
  }, [studentId]);

  const selectedStudent = students.find((student) => student.id === studentId) ?? null;
  const filteredStudents = students.filter((student) => {
    const query = studentSearch.toLowerCase();
    return (
      getDisplayName(student).toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });
  const filteredStudentCases = studentCases.filter((medicalCase) => {
    const query = assignedCaseSearch.toLowerCase();
    return (
      (medicalCase.caseTitle ?? medicalCase.name).toLowerCase().includes(query) ||
      (medicalCase.patientName ?? medicalCase.patient).toLowerCase().includes(query)
    );
  });
  const availableCases = facultyCases.filter(
    (medicalCase) => !studentCases.some((studentCase) => studentCase.id === medicalCase.id)
  );
  const filteredAvailableCases = availableCases.filter((medicalCase) => {
    const query = availableCaseSearch.toLowerCase();
    return (
      (medicalCase.caseTitle ?? medicalCase.name).toLowerCase().includes(query) ||
      (medicalCase.patientName ?? medicalCase.patient).toLowerCase().includes(query)
    );
  });

  function resetDialog() {
    setNewCaseForm(DEFAULT_FACULTY_CASE_FORM);
    setPictureFile(null);
    setPicturePreview(null);
    setSubmittingNewCase(false);
  }

  function handlePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPictureFile(file);
    setPicturePreview(file ? URL.createObjectURL(file) : null);
  }

  async function refreshStudentAndCases() {
    const token = getStoredToken();
    if (!token || !studentId) return;

    const [{ students: nextStudents }, { cases: nextFacultyCases }, { cases: nextStudentCases }] =
      await Promise.all([
        facultyListStudents(token),
        facultyListCases(token),
        facultyListStudentCases(token, studentId),
      ]);

    setStudents(nextStudents);
    setFacultyCases(nextFacultyCases);
    setStudentCases(nextStudentCases);
  }

  async function handleAssignExistingCase(caseId: number) {
    if (!selectedStudent) {
      setActionError("Select a valid student before assigning a case.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    try {
      setAssigningCaseId(caseId);
      setActionError(null);
      const assignedCase = facultyCases.find((medicalCase) => medicalCase.id === caseId) ?? null;
      await facultyAssignCase(token, {
        patientId: caseId,
        studentId: selectedStudent.id,
      });
      await refreshStudentAndCases();
      setActionMessage(
        `Assigned ${assignedCase?.patientName ?? assignedCase?.patient ?? "case"} to ${getDisplayName(selectedStudent)}.`
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to assign case.");
    } finally {
      setAssigningCaseId(null);
    }
  }

  async function handleCreateAndAssign() {
    if (!selectedStudent) {
      setActionError("Select a valid student before creating a case.");
      return;
    }

    if (!newCaseForm.name.trim()) {
      setActionError("Patient name is required.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    try {
      setSubmittingNewCase(true);
      setActionError(null);
      const { case: created } = await facultyCreateCase(token, {
        name: newCaseForm.name.trim(),
        caseTitle: newCaseForm.chiefComplaint.trim() || newCaseForm.name.trim(),
        dob: newCaseForm.dob || undefined,
        gender: newCaseForm.gender,
        codeStatus: newCaseForm.codeStatus,
        location: newCaseForm.location.trim() || undefined,
        caseType: newCaseForm.caseType,
        hasLabs: newCaseForm.hasLabs,
      });

      if (pictureFile) {
        await facultyUploadCasePicture(token, created.id, pictureFile);
      }

      await facultyAssignCase(token, { patientId: created.id, studentId: selectedStudent.id });
      await refreshStudentAndCases();
      setActionMessage(`Created and assigned a new case to ${getDisplayName(selectedStudent)}.`);
      setAssignDialogOpen(false);
      resetDialog();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create and assign case.");
    } finally {
      setSubmittingNewCase(false);
    }
  }

  async function handleConfirmCaseAction() {
    if (!actionDialog) return;

    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    try {
      setProcessingAction(true);
      setActionError(null);

      if (actionDialog.mode === "unassign") {
        await facultyUnassignCase(token, actionDialog.assignmentId);
        await refreshStudentAndCases();
        setActionMessage(
          `Unassigned ${actionDialog.patientName} from ${selectedStudent ? getDisplayName(selectedStudent) : "the student"}.`
        );
      } else {
        await facultyDeleteCase(token, actionDialog.caseId);
        await refreshStudentAndCases();
        setActionMessage(`Deleted case for ${actionDialog.patientName}.`);
      }

      setActionDialog(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : actionDialog.mode === "unassign"
            ? "Failed to unassign case."
            : "Failed to delete case."
      );
    } finally {
      setProcessingAction(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <FacultyPageTopBar
        title="Student Manager"
        isAdmin={isAdmin}
        secondaryActionLabel="Back"
        onTitleClick={() => navigate("/faculty")}
        onGoAdmin={() => navigate("/admin/users")}
        onSecondaryAction={() => navigate("/faculty")}
        onGoSettings={() => navigate("/settings")}
        onLogout={handleLogout}
      />

      <FacultyStudentSidebar
        studentId={studentId}
        studentSearch={studentSearch}
        assignedCaseSearch={assignedCaseSearch}
        filteredStudents={filteredStudents}
        filteredStudentCases={filteredStudentCases}
        studentCasesLoading={studentCasesLoading}
        onStudentSearchChange={setStudentSearch}
        onAssignedCaseSearchChange={setAssignedCaseSearch}
        onStudentSelect={(nextStudentId) => navigate(`/student/${nextStudentId}`)}
        onAssignedCaseSelect={(caseId) => navigate(`/studentCase/${studentId}/${caseId}`)}
      />

      <Box sx={{ flex: 1, ml: "320px", mt: { xs: "56px", sm: "64px" }, p: { xs: 2, md: 4 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : pageError ? (
          <Alert severity="error">{pageError}</Alert>
        ) : !selectedStudent ? (
          <Alert severity="warning">Select a valid student from the sidebar.</Alert>
        ) : (
          <Box sx={{ maxWidth: 1100 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {getDisplayName(selectedStudent)}
                </Typography>
                <Typography color="text.secondary">{selectedStudent.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip label={`${selectedStudent.assignmentCount} assigned`} />
                  <Chip label={`${selectedStudent.submittedCount} submitted`} color="info" />
                  <Chip
                    label={`${selectedStudent.pendingSubmissionCount} pending`}
                    color="warning"
                    variant="outlined"
                  />
                </Stack>
              </Box>

              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: "#1a3a5c", fontWeight: 700, px: 3, textTransform: "none" }}
                onClick={() => {
                  setActionMessage(null);
                  setActionError(null);
                  setAssignDialogOpen(true);
                }}
              >
                + Create & Assign Case
              </Button>
            </Box>

            {actionMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {actionMessage}
              </Alert>
            )}

            {actionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {actionError}
              </Alert>
            )}

            <Stack spacing={3}>
              <FacultyAssignedCasesCard
                studentCasesLoading={studentCasesLoading}
                studentCases={studentCases}
                onReviewCase={(caseId) => navigate(`/studentCase/${studentId}/${caseId}`)}
                onRequestUnassign={(medicalCase) =>
                  setActionDialog({
                    mode: "unassign",
                    assignmentId: medicalCase.assignmentId,
                    caseId: medicalCase.id,
                    patientName: medicalCase.patientName ?? medicalCase.patient,
                    caseName: medicalCase.caseTitle ?? medicalCase.name,
                  })
                }
                onRequestDelete={(medicalCase) =>
                  setActionDialog({
                    mode: "delete",
                    caseId: medicalCase.id,
                    patientName: medicalCase.patientName ?? medicalCase.patient,
                    caseName: medicalCase.caseTitle ?? medicalCase.name,
                  })
                }
              />

              <FacultyAvailableCasesCard
                availableCaseSearch={availableCaseSearch}
                filteredAvailableCases={filteredAvailableCases}
                assigningCaseId={assigningCaseId}
                onAvailableCaseSearchChange={setAvailableCaseSearch}
                onAssignCase={(caseId) => void handleAssignExistingCase(caseId)}
                onRequestDelete={(medicalCase) =>
                  setActionDialog({
                    mode: "delete",
                    caseId: medicalCase.id,
                    patientName: medicalCase.patientName ?? medicalCase.patient,
                    caseName: medicalCase.caseTitle ?? medicalCase.name,
                  })
                }
              />
            </Stack>
          </Box>
        )}
      </Box>

      <FacultyCreateAssignCaseDialog
        open={assignDialogOpen}
        studentName={selectedStudent ? getDisplayName(selectedStudent) : "the selected student"}
        submittingNewCase={submittingNewCase}
        caseForm={newCaseForm}
        picturePreview={picturePreview}
        onClose={() => {
          setAssignDialogOpen(false);
          resetDialog();
        }}
        onSave={() => void handleCreateAndAssign()}
        onPictureChange={handlePictureChange}
        onCaseFormChange={setNewCaseForm}
      />

      <FacultyCaseActionDialog
        actionDialog={actionDialog}
        processingAction={processingAction}
        onClose={() => setActionDialog(null)}
        onConfirm={() => void handleConfirmCaseAction()}
      />
    </Box>
  );
}

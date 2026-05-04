import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import { getDisplayName, getMe, getStoredToken, logout } from "../../services/authApi";
import {
  facultyAssignCase,
  facultyCopyCaseTemplateToCourse,
  facultyCreateCase,
  facultyDeleteCase,
  facultyListCases,
  facultyListCaseTemplates,
  facultyListStudentCases,
  facultyListStudents,
  facultyUnassignCase,
  facultyUploadCasePicture,
  type FacultyCase,
  type FacultyCaseTemplate,
  type FacultyStudent,
  type FacultyStudentCase,
} from "../../services/facultyApi";
import FacultyAssignedCasesCard from "./FacultyAssignedCasesCard";
import FacultyAvailableCasesCard, {
  type FacultyAvailableCaseItem,
} from "./FacultyAvailableCasesCard";
import FacultyCaseActionDialog from "./FacultyCaseActionDialog";
import FacultyCreateAssignCaseDialog from "./FacultyCreateAssignCaseDialog";
import FacultyPageTopBar from "./FacultyPageTopBar";
import FacultyStudentSidebar from "./FacultyStudentSidebar";
import {
  DEFAULT_FACULTY_CASE_FORM,
  type FacultyCaseFormState,
} from "./facultyDashboardTypes";
import type { CaseActionDialogState } from "./facultyStudentPageTypes";

const SELECTED_COURSE_STORAGE_KEY = "faculty_selected_course_id";

function isRouteNotFound(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("route not found");
}

async function listCaseTemplatesIfAvailable(token: string): Promise<FacultyCaseTemplate[]> {
  try {
    const { templates } = await facultyListCaseTemplates(token);
    return templates;
  } catch (error) {
    if (!isRouteNotFound(error)) throw error;
    return [];
  }
}

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const navigate = useNavigate();

  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [facultyCases, setFacultyCases] = useState<FacultyCase[]>([]);
  const [caseTemplates, setCaseTemplates] = useState<FacultyCaseTemplate[]>([]);
  const [studentCases, setStudentCases] = useState<FacultyStudentCase[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [assignedCaseSearch, setAssignedCaseSearch] = useState("");
  const [availableCaseSearch, setAvailableCaseSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentCasesLoading, setStudentCasesLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assigningCaseKey, setAssigningCaseKey] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<CaseActionDialogState | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [submittingNewCase, setSubmittingNewCase] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [newCaseForm, setNewCaseForm] = useState<FacultyCaseFormState>(DEFAULT_FACULTY_CASE_FORM);

  useEffect(() => {
    if (courseId || !studentId) return;

    const storedCourseId = localStorage.getItem(SELECTED_COURSE_STORAGE_KEY);
    if (storedCourseId) {
      navigate(`/student/${studentId}?courseId=${storedCourseId}`, { replace: true });
    }
  }, [courseId, navigate, studentId]);

  useEffect(() => {
    if (courseId) {
      localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, courseId);
    }
  }, [courseId]);

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
        const [{ students: nextStudents }, { cases: nextCases }, templates, me] = await Promise.all([
          facultyListStudents(token, courseId),
          facultyListCases(token, courseId),
          listCaseTemplatesIfAvailable(token),
          getMe(token),
        ]);

        if (!active) return;
        setStudents(nextStudents);
        setFacultyCases(nextCases);
        setCaseTemplates(templates);
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
  }, [courseId]);

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
        const { cases: nextCases } = await facultyListStudentCases(token, studentId, courseId);
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
  }, [studentId, courseId]);

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
  const assignedCaseIds = new Set(studentCases.map((medicalCase) => medicalCase.id));
  const copiedTemplateIds = new Set(
    facultyCases
      .map((medicalCase) => medicalCase.templateId)
      .filter((templateId): templateId is string => Boolean(templateId))
  );
  const assignedTemplateIds = new Set(
    studentCases
      .map((medicalCase) => medicalCase.templateId)
      .filter((templateId): templateId is string => Boolean(templateId))
  );

  const availableCases: FacultyAvailableCaseItem[] = [
    ...facultyCases
      .filter((medicalCase) => !assignedCaseIds.has(medicalCase.id))
      .map((medicalCase): FacultyAvailableCaseItem => ({
        source: "course",
        key: `course-${medicalCase.id}`,
        id: medicalCase.id,
        patientName: medicalCase.patientName ?? medicalCase.patient,
        caseTitle: medicalCase.caseTitle ?? medicalCase.name,
        caseType: medicalCase.caseType,
        hasLabs: medicalCase.hasLabs,
        submittedNoteCount: medicalCase.submittedNoteCount,
        assignmentCount: medicalCase.assignments.length,
        case: medicalCase,
      })),
    ...caseTemplates
      .filter((template) => !copiedTemplateIds.has(template.id) && !assignedTemplateIds.has(template.id))
      .map((template): FacultyAvailableCaseItem => ({
        source: "bank",
        key: `bank-${template.id}`,
        templateId: template.id,
        patientName: template.patientName,
        caseTitle: template.title,
        caseType: template.caseType,
        hasLabs: template.hasLabs,
      })),
  ];
  const filteredAvailableCases = availableCases.filter((medicalCase) => {
    const query = availableCaseSearch.toLowerCase();
    return (
      medicalCase.caseTitle.toLowerCase().includes(query) ||
      medicalCase.patientName.toLowerCase().includes(query)
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

    const [{ students: nextStudents }, { cases: nextFacultyCases }, { cases: nextStudentCases }, templates] =
      await Promise.all([
        facultyListStudents(token, courseId),
        facultyListCases(token, courseId),
        facultyListStudentCases(token, studentId, courseId),
        listCaseTemplatesIfAvailable(token),
      ]);

    setStudents(nextStudents);
    setFacultyCases(nextFacultyCases);
    setStudentCases(nextStudentCases);
    setCaseTemplates(templates);
  }

  async function handleAssignExistingCase(medicalCase: FacultyAvailableCaseItem) {
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
      setAssigningCaseKey(medicalCase.key);
      setActionError(null);
      let patientId: number;
      let copiedPatientId: number | null = null;

      if (medicalCase.source === "bank") {
        if (!courseId) {
          setActionError("Select a course before assigning a case bank case.");
          return;
        }

        const { case: copiedCase } = await facultyCopyCaseTemplateToCourse(
          token,
          medicalCase.templateId,
          courseId
        );
        patientId = copiedCase.id;
        copiedPatientId = copiedCase.id;
      } else {
        patientId = medicalCase.id;
      }

      try {
        await facultyAssignCase(token, {
          patientId,
          studentId: selectedStudent.id,
        });
      } catch (assignError) {
        if (copiedPatientId !== null) {
          await facultyDeleteCase(token, copiedPatientId).catch(() => undefined);
        }
        throw assignError;
      }

      await refreshStudentAndCases();
      setActionMessage(
        `Assigned ${medicalCase.patientName} to ${getDisplayName(selectedStudent)}.`
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to assign case.");
    } finally {
      setAssigningCaseKey(null);
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
    if (!courseId) {
      setActionError("Select a course before creating and assigning a case.");
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
        courseId,
      });

      try {
        if (pictureFile) {
          await facultyUploadCasePicture(token, created.id, pictureFile);
        }
        await facultyAssignCase(token, { patientId: created.id, studentId: selectedStudent.id });
      } catch (createAssignError) {
        await facultyDeleteCase(token, created.id).catch(() => undefined);
        throw createAssignError;
      }

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
        onStudentSelect={(nextStudentId) => navigate(`/student/${nextStudentId}${courseId ? `?courseId=${courseId}` : ""}`)}
        onAssignedCaseSelect={(caseId) =>
          navigate(`/studentCase/${studentId}/${caseId}${courseId ? `?courseId=${courseId}` : ""}`)
        }
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
                onReviewCase={(caseId) =>
                  navigate(`/studentCase/${studentId}/${caseId}${courseId ? `?courseId=${courseId}` : ""}`)
                }
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
                assigningCaseKey={assigningCaseKey}
                onAvailableCaseSearchChange={setAvailableCaseSearch}
                onAssignCase={(medicalCase) => void handleAssignExistingCase(medicalCase)}
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

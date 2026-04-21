import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";

import { getDisplayName, getMe, getStoredToken, logout } from "../services/authApi";
import { useAuthenticatedAssetUrl } from "../hooks/useAuthenticatedAssetUrl";
import {
  facultyCreateCase,
  facultyGetCase,
  facultyListCases,
  facultyListStudents,
  facultyUpdateCase,
  facultyUploadCasePicture,
  type FacultyCase,
  type FacultyStudent,
} from "../services/facultyApi";
import FacultyCaseDialog from "../components/faculty/FacultyCaseDialog";
import FacultyDashboardSidebar from "../components/faculty/FacultyDashboardSidebar";
import FacultyDashboardStats from "../components/faculty/FacultyDashboardStats";
import FacultyDashboardTopBar from "../components/faculty/FacultyDashboardTopBar";
import {
  DEFAULT_FACULTY_CASE_FORM,
  type FacultyCaseFormState,
} from "../components/faculty/facultyDashboardTypes";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [studentSearch, setStudentSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [cases, setCases] = useState<FacultyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [savingCase, setSavingCase] = useState(false);
  const [caseForm, setCaseForm] = useState<FacultyCaseFormState>(DEFAULT_FACULTY_CASE_FORM);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const { assetUrl: resolvedPicturePreview } = useAuthenticatedAssetUrl(picturePreview);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const token = getStoredToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setError("You are not logged in.");
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
        setCases(nextCases);
        setIsAdmin(me.user.role === "admin");
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load faculty dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const filteredStudents = students.filter((student) => {
    const query = studentSearch.toLowerCase();
    return (
      getDisplayName(student).toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });

  const filteredCases = cases.filter((medicalCase) => {
    const query = caseSearch.toLowerCase();
    return (
      (medicalCase.caseTitle ?? medicalCase.name).toLowerCase().includes(query) ||
      (medicalCase.patientName ?? medicalCase.patient).toLowerCase().includes(query)
    );
  });

  const totalSubmitted = cases.reduce((sum, medicalCase) => sum + medicalCase.submittedNoteCount, 0);
  const totalPending = cases.reduce((sum, medicalCase) => sum + medicalCase.pendingSubmissionCount, 0);

  function resetCaseDialog() {
    setEditingCaseId(null);
    setCaseForm(DEFAULT_FACULTY_CASE_FORM);
    setPictureFile(null);
    setPicturePreview(null);
    setSavingCase(false);
  }

  async function refreshDashboard() {
    const token = getStoredToken();
    if (!token) return;

    const [{ students: nextStudents }, { cases: nextCases }] = await Promise.all([
      facultyListStudents(token),
      facultyListCases(token),
    ]);

    setStudents(nextStudents);
    setCases(nextCases);
  }

  function openCreateDialog() {
    resetCaseDialog();
    setActionMessage(null);
    setActionError(null);
    setCaseDialogOpen(true);
  }

  async function openEditDialog(caseId: number) {
    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    try {
      setActionError(null);
      const { case: nextCase } = await facultyGetCase(token, caseId);
      setEditingCaseId(caseId);
      setCaseForm({
        name: nextCase.patient,
        chiefComplaint: nextCase.name !== nextCase.patient ? nextCase.name : "",
        dob: nextCase.dob ? new Date(nextCase.dob).toISOString().slice(0, 10) : "",
        gender: nextCase.gender || "Other",
        codeStatus: nextCase.codeStatus || "Full Code",
        location: nextCase.location || "",
        caseType: nextCase.caseType || "pbl",
        hasLabs: nextCase.hasLabs,
      });
      setPictureFile(null);
      setPicturePreview(nextCase.profilePictureUrl ?? null);
      setCaseDialogOpen(true);
    } catch (loadError) {
      setActionError(loadError instanceof Error ? loadError.message : "Failed to load case.");
    }
  }

  function handlePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPictureFile(file);
    setPicturePreview(file ? URL.createObjectURL(file) : picturePreview);
  }

  async function handleSaveCase() {
    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    if (!caseForm.name.trim()) {
      setActionError("Patient name is required.");
      return;
    }

    try {
      setSavingCase(true);
      setActionError(null);
      setActionMessage(null);

      if (editingCaseId !== null) {
        await facultyUpdateCase(token, editingCaseId, {
          name: caseForm.name.trim(),
          caseTitle: caseForm.chiefComplaint.trim() || caseForm.name.trim(),
          dob: caseForm.dob || undefined,
          gender: caseForm.gender,
          codeStatus: caseForm.codeStatus,
          location: caseForm.location.trim() || undefined,
          caseType: caseForm.caseType,
          hasLabs: caseForm.hasLabs,
        });

        if (pictureFile) {
          await facultyUploadCasePicture(token, editingCaseId, pictureFile);
        }

        await refreshDashboard();
        setActionMessage(`Updated case for ${caseForm.name.trim()}.`);
      } else {
        const { case: created } = await facultyCreateCase(token, {
          name: caseForm.name.trim(),
          caseTitle: caseForm.chiefComplaint.trim() || caseForm.name.trim(),
          dob: caseForm.dob || undefined,
          gender: caseForm.gender,
          codeStatus: caseForm.codeStatus,
          location: caseForm.location.trim() || undefined,
          caseType: caseForm.caseType,
          hasLabs: caseForm.hasLabs,
        });

        if (pictureFile) {
          await facultyUploadCasePicture(token, created.id, pictureFile);
        }

        await refreshDashboard();
        setActionMessage(`Created case for ${caseForm.name.trim()}.`);
      }

      setCaseDialogOpen(false);
      resetCaseDialog();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Failed to save case.");
    } finally {
      setSavingCase(false);
    }
  }

  function handleCloseCaseDialog() {
    setCaseDialogOpen(false);
    resetCaseDialog();
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <FacultyDashboardTopBar
        isAdmin={isAdmin}
        onGoHome={() => navigate("/faculty")}
        onGoToAdmin={() => navigate("/admin/users")}
        onGoToSettings={() => navigate("/settings")}
        onLogout={handleLogout}
      />

      <FacultyDashboardSidebar
        studentSearch={studentSearch}
        caseSearch={caseSearch}
        students={filteredStudents}
        cases={filteredCases}
        onStudentSearchChange={setStudentSearch}
        onCaseSearchChange={setCaseSearch}
        onStudentSelect={(studentId) => navigate(`/student/${studentId}`)}
        onCaseSelect={(caseId) => void openEditDialog(caseId)}
      />

      <Box sx={{ flex: 1, ml: "320px", mt: "64px", p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Faculty Dashboard
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            sx={{ bgcolor: "#1a3a5c", fontWeight: 700, px: 3, textTransform: "none" }}
            onClick={openCreateDialog}
          >
            + Create Case
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <FacultyDashboardStats
            studentCount={students.length}
            caseCount={cases.length}
            submittedCount={totalSubmitted}
            pendingCount={totalPending}
          />
        )}
      </Box>

      <FacultyCaseDialog
        open={caseDialogOpen}
        editingCaseId={editingCaseId}
        savingCase={savingCase}
        caseForm={caseForm}
        picturePreview={resolvedPicturePreview}
        onClose={handleCloseCaseDialog}
        onSave={() => void handleSaveCase()}
        onPictureChange={handlePictureChange}
        onCaseFormChange={setCaseForm}
      />
    </Box>
  );
}

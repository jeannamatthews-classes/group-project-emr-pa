import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { getDisplayName, getMe, getStoredToken, logout } from "../services/authApi";
import { useAuthenticatedAssetUrl } from "../hooks/useAuthenticatedAssetUrl";
import {
  facultyCreateCase,
  facultyCreateCourse,
  facultyDeleteCase,
  facultyDeleteCourse,
  facultyGetCase,
  facultyListCases,
  facultyListCourses,
  facultyListFacultyUsers,
  facultyListStudents,
  facultyUpdateCase,
  facultyUpdateCourseMembers,
  facultyUploadCasePicture,
  type FacultyCase,
  type FacultyCourse,
  type FacultyStudent,
  type FacultyUser,
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
  const [allStudents, setAllStudents] = useState<FacultyStudent[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<FacultyUser[]>([]);
  const [cases, setCases] = useState<FacultyCase[]>([]);
  const [courses, setCourses] = useState<FacultyCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [savingCase, setSavingCase] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);
  const [caseForm, setCaseForm] = useState<FacultyCaseFormState>(DEFAULT_FACULTY_CASE_FORM);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseStudentIds, setCourseStudentIds] = useState<string[]>([]);
  const [courseFacultyIds, setCourseFacultyIds] = useState<string[]>([]);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const { assetUrl: resolvedPicturePreview } = useAuthenticatedAssetUrl(picturePreview);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedCourseStudents = allStudents.filter((student) => courseStudentIds.includes(student.id));
  const selectedCourseFaculty = facultyUsers.filter((faculty) => courseFacultyIds.includes(faculty.id));

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
        const [{ courses: nextCourses }, { students: nextAllStudents }, { faculty }, me] =
          await Promise.all([
            facultyListCourses(token),
            facultyListStudents(token),
            facultyListFacultyUsers(token),
            getMe(token),
          ]);
        const initialCourseId = nextCourses[0]?.id ?? "";

        if (!active) return;
        setCourses(nextCourses);
        setSelectedCourseId(initialCourseId);
        setAllStudents(nextAllStudents);
        setFacultyUsers(faculty);
        setIsAdmin(me.user.role === "admin");
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load faculty dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourseData() {
      const token = getStoredToken();
      if (!token || !selectedCourseId) {
        setStudents([]);
        setCases([]);
        return;
      }

      try {
        const [{ students: nextStudents }, { cases: nextCases }] = await Promise.all([
          facultyListStudents(token, selectedCourseId),
          facultyListCases(token, selectedCourseId),
        ]);
        if (!active) return;
        setStudents(nextStudents);
        setCases(nextCases);
      } catch (loadError) {
        if (!active) return;
        setActionError(loadError instanceof Error ? loadError.message : "Failed to load course.");
      }
    }

    void loadCourseData();
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!actionMessage && !actionError) return;

    const timeoutId = window.setTimeout(() => {
      setActionMessage(null);
      setActionError(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [actionMessage, actionError]);

  const filteredStudents = students.filter((student) => {
    const query = studentSearch.toLowerCase();
    return getDisplayName(student).toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
  });

  const filteredCases = cases.filter((medicalCase) => {
    const query = caseSearch.toLowerCase();
    return (
      (medicalCase.caseTitle ?? medicalCase.name).toLowerCase().includes(query) ||
      (medicalCase.patientName ?? medicalCase.patient).toLowerCase().includes(query)
    );
  });

  const totalSubmitted = cases.reduce((sum, medicalCase) => sum + medicalCase.submittedNoteCount, 0);
  const totalPending = cases.reduce((sum, medicalCase) => sum + medicalCase.pendingReviewCount, 0);

  function resetCaseDialog() {
    setEditingCaseId(null);
    setCaseForm(DEFAULT_FACULTY_CASE_FORM);
    setPictureFile(null);
    setPicturePreview(null);
    setSavingCase(false);
    setDeletingCase(false);
  }

  async function refreshDashboard() {
    const token = getStoredToken();
    if (!token || !selectedCourseId) return;

    const [{ students: nextStudents }, { cases: nextCases }, { courses: nextCourses }] = await Promise.all([
      facultyListStudents(token, selectedCourseId),
      facultyListCases(token, selectedCourseId),
      facultyListCourses(token),
    ]);

    setStudents(nextStudents);
    setCases(nextCases);
    setCourses(nextCourses);
  }

  function openCreateDialog() {
    resetCaseDialog();
    setActionMessage(null);
    if (!selectedCourseId) {
      setActionError("Create or select a course before creating cases.");
      return;
    }
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
    if (editingCaseId === null && !selectedCourseId) {
      setActionError("Select a course before creating a case.");
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
        if (pictureFile) await facultyUploadCasePicture(token, editingCaseId, pictureFile);
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
          courseId: selectedCourseId,
        });
        if (pictureFile) await facultyUploadCasePicture(token, created.id, pictureFile);
        setActionMessage(`Created case for ${caseForm.name.trim()}.`);
      }

      await refreshDashboard();
      setCaseDialogOpen(false);
      resetCaseDialog();
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Failed to save case.");
    } finally {
      setSavingCase(false);
    }
  }

  async function handleDeleteCase() {
    if (editingCaseId === null) return;
    const patientName = caseForm.name.trim() || "this patient";
    if (!window.confirm(`Delete the case for ${patientName}? This cannot be undone.`)) return;

    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }

    try {
      setDeletingCase(true);
      setActionError(null);
      setActionMessage(null);
      await facultyDeleteCase(token, editingCaseId);
      await refreshDashboard();
      setCaseDialogOpen(false);
      resetCaseDialog();
      setActionMessage(`Deleted case for ${patientName}.`);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete case.");
    } finally {
      setDeletingCase(false);
    }
  }

  function openCourseDialog(forNewCourse = false) {
    const course = forNewCourse ? null : selectedCourse;
    setCreatingCourse(forNewCourse || !selectedCourseId);
    setCourseName(course?.name ?? "");
    setCourseCode(course?.code ?? "");
    setCourseStudentIds(course?.members.filter((member) => member.role === "student").map((member) => member.userId) ?? []);
    setCourseFacultyIds(course?.members.filter((member) => member.role === "faculty").map((member) => member.userId) ?? []);
    setCourseDialogOpen(true);
  }

  async function handleSaveCourse() {
    const token = getStoredToken();
    if (!token) {
      setActionError("You are not logged in.");
      return;
    }
    if (!courseName.trim()) {
      setActionError("Course name is required.");
      return;
    }

    try {
      setSavingCourse(true);
      setActionError(null);
      setActionMessage(null);
      const result = !creatingCourse && selectedCourseId
        ? await facultyUpdateCourseMembers(token, selectedCourseId, {
            studentIds: courseStudentIds,
            facultyIds: courseFacultyIds,
          })
        : await facultyCreateCourse(token, {
            name: courseName.trim(),
            code: courseCode.trim() || undefined,
            studentIds: courseStudentIds,
            facultyIds: courseFacultyIds,
          });
      const [{ courses: nextCourses }, { students: nextAllStudents }, { faculty }] = await Promise.all([
        facultyListCourses(token),
        facultyListStudents(token),
        facultyListFacultyUsers(token),
      ]);
      setCourses(nextCourses);
      setAllStudents(nextAllStudents);
      setFacultyUsers(faculty);
      setSelectedCourseId(result.course.id);
      setCourseDialogOpen(false);
      setActionMessage(!creatingCourse && selectedCourseId ? "Course roster updated." : `Created ${courseName.trim()}.`);
    } catch (courseError) {
      setActionError(courseError instanceof Error ? courseError.message : "Failed to save course.");
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleDeleteCourse() {
    const token = getStoredToken();
    if (!token || !selectedCourseId || !selectedCourse) {
      setActionError("Select a course before deleting.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedCourse.name}? This will also delete every case, assignment, note, and lab in this course.`
    );
    if (!confirmed) return;

    try {
      setDeletingCourse(true);
      setActionError(null);
      setActionMessage(null);
      const { deletedCourse } = await facultyDeleteCourse(token, selectedCourseId);
      const { courses: nextCourses } = await facultyListCourses(token);
      const nextCourseId = nextCourses[0]?.id ?? "";

      setCourses(nextCourses);
      setSelectedCourseId(nextCourseId);
      setCourseDialogOpen(false);
      setStudents([]);
      setCases([]);
      setActionMessage(
        `Deleted ${deletedCourse.name} and ${deletedCourse.deletedCaseCount} course case${deletedCourse.deletedCaseCount === 1 ? "" : "s"}.`
      );
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete course.");
    } finally {
      setDeletingCourse(false);
    }
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
        onStudentSelect={(studentId) => navigate(`/student/${studentId}?courseId=${selectedCourseId}`)}
        onCaseSelect={(caseId) => void openEditDialog(caseId)}
      />

      <Box sx={{ flex: 1, ml: "320px", mt: "64px", p: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Faculty Dashboard
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel>Course</InputLabel>
                <Select label="Course" value={selectedCourseId} onChange={(event) => setSelectedCourseId(String(event.target.value))}>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.code ? `${course.code} - ${course.name}` : course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={() => openCourseDialog(false)} sx={{ textTransform: "none" }}>
                {selectedCourseId ? "Manage Course" : "Create Course"}
              </Button>
              {selectedCourseId && (
                <Button variant="text" onClick={() => openCourseDialog(true)} sx={{ textTransform: "none" }}>
                  New Course
                </Button>
              )}
            </Box>
          </Box>

          <Button variant="contained" size="large" sx={{ bgcolor: "#1a3a5c", fontWeight: 700, px: 3, textTransform: "none" }} onClick={openCreateDialog} disabled={!selectedCourseId}>
            + Create Case
          </Button>
        </Box>

        {actionMessage && <Alert severity="success" sx={{ mb: 2 }}>{actionMessage}</Alert>}
        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !selectedCourseId ? (
          <Alert severity="info">Create a course, add faculty and students, then create cases inside that course.</Alert>
        ) : (
          <FacultyDashboardStats studentCount={students.length} caseCount={cases.length} submittedCount={totalSubmitted} pendingCount={totalPending} />
        )}
      </Box>

      <FacultyCaseDialog
        open={caseDialogOpen}
        editingCaseId={editingCaseId}
        savingCase={savingCase}
        deletingCase={deletingCase}
        caseForm={caseForm}
        picturePreview={resolvedPicturePreview}
        onClose={() => {
          setCaseDialogOpen(false);
          resetCaseDialog();
        }}
        onSave={() => void handleSaveCase()}
        onDelete={() => void handleDeleteCase()}
        onPictureChange={handlePictureChange}
        onCaseFormChange={setCaseForm}
      />

      <Dialog open={courseDialogOpen} onClose={savingCourse || deletingCourse ? undefined : () => setCourseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#1a3a5c", color: "#fff" }}>
          {creatingCourse ? "Create Course" : "Manage Course"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Course Name" required value={courseName} disabled={!creatingCourse} onChange={(event) => setCourseName(event.target.value)} />
          <TextField label="Course Code" value={courseCode} disabled={!creatingCourse} onChange={(event) => setCourseCode(event.target.value)} />
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={allStudents}
            value={selectedCourseStudents}
            getOptionLabel={(option) => `${getDisplayName(option)} ${option.email}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => setCourseStudentIds(value.map((student) => student.id))}
            renderInput={(params) => <TextField {...params} label="Students" placeholder="Search students" />}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                <ListItemText primary={getDisplayName(option)} secondary={option.email} />
              </li>
            )}
            renderTags={(value) => `${value.length} selected`}
          />
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={facultyUsers}
            value={selectedCourseFaculty}
            getOptionLabel={(option) => `${getDisplayName(option)} ${option.email}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => setCourseFacultyIds(value.map((faculty) => faculty.id))}
            renderInput={(params) => <TextField {...params} label="Faculty" placeholder="Search faculty" />}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                <ListItemText primary={getDisplayName(option)} secondary={option.email} />
              </li>
            )}
            renderTags={(value) => `${value.length} selected`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {!creatingCourse && selectedCourseId ? (
            <Button
              color="error"
              variant="outlined"
              onClick={() => void handleDeleteCourse()}
              disabled={savingCourse || deletingCourse}
              sx={{ textTransform: "none", fontWeight: 700, mr: "auto" }}
            >
              {deletingCourse ? "Deleting..." : "Delete Course"}
            </Button>
          ) : null}
          <Button onClick={() => setCourseDialogOpen(false)} disabled={savingCourse || deletingCourse} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSaveCourse()} disabled={savingCourse || deletingCourse} sx={{ bgcolor: "#1a3a5c", textTransform: "none", fontWeight: 700 }}>
            {savingCourse ? "Saving..." : "Save Course"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

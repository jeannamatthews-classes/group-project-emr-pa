import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import Collapse from "@mui/material/Collapse";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Drawer,
  //IconButton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
//import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";

import {
  getStudentCases,
  getStudentCaseLabs,
  getNote,
  saveNote,
  submitNote,
  getStudentGrades,
} from "../services/casesApi";
import type {
  AssignedCase,
  NoteData,
  GradeNote,
  SaveNotePayload,
  StudentCaseLab,
} from "../services/casesApi";
import { touchCase, sortByLastInteracted } from "../services/caseStorage";
import { buildAuthenticatedAssetUrl, getDisplayName, isGuestModeEnabled, logout, getStoredToken } from "../services/authApi";

// ─── Section config ───────────────────────────────────────────────────────────

type SectionKey =
  | "hpi" | "med" | "exam" | "aller" | "assess"
  | "fhist" | "shist" | "proc" | "diag" | "lad"
  | "treat" | "cab" | "learn";

type NoteField = keyof SaveNotePayload;
type NoteFields = SaveNotePayload & {
  id?: string;
  isSubmitted?: boolean;
  submittedAt?: string | null;
  grade?: number | null;
  feedback?: string | null;
};

const SECTIONS: { key: SectionKey; label: string; field: NoteField }[] = [
  { key: "hpi",   label: "HPI",                field: "hpi" },
  { key: "med",   label: "Medications",         field: "medications" },
  { key: "exam",  label: "Physical Exam",        field: "exam" },
  { key: "aller", label: "Allergies",            field: "allergies" },
  { key: "assess",label: "Assessment",           field: "assessment" },
  { key: "fhist", label: "Family History",       field: "familyHistory" },
  { key: "shist", label: "Social History",       field: "socialHistory" },
  { key: "proc",  label: "Procedures",           field: "procedures" },
  { key: "diag",  label: "Diagnosis",            field: "diagnosis" },
  { key: "lad",   label: "Lab and Diagnostics",  field: "labAndDiagnostics" },
  { key: "treat", label: "Treatment Plan",       field: "treatmentPlan" },
  { key: "cab",   label: "Coding and Billing",   field: "codingAndBilling" },
  { key: "learn", label: "Learning Issues",      field: "learningIssues" },
];

type OpenSections = Record<SectionKey, boolean>;

const DEFAULT_OPEN: OpenSections = {
  hpi: true, med: false, exam: false, aller: false, assess: false,
  fhist: false, shist: false, proc: false, diag: false, lad: false,
  treat: false, cab: false, learn: false,
};

type PortalCase = AssignedCase;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(c: AssignedCase): string {
  const name = c.patientName ?? c.name;
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function noteToFields(note: NoteData): NoteFields {
  return {
    id: note.id,
    caseId: note.caseId ?? note.patientId,
    hpi: note.hpi ?? "",
    exam: note.physicalExam ?? "",
    assessment: note.assessment,
    treatmentPlan: note.treatmentPlan,
    medications: note.medications,
    allergies: note.allergies,
    familyHistory: note.familyHistory,
    socialHistory: note.socialHistory,
    procedures: note.procedures,
    diagnosis: note.diagnosis,
    labAndDiagnostics: note.labAndDiagnostics,
    codingAndBilling: note.codingAndBilling,
    learningIssues: note.learningIssues,
    isSubmitted: note.isSubmitted,
    submittedAt: note.submittedAt,
    grade: note.grade,
    feedback: note.feedback,
  };
}

function resolveAssetUrl(fileUrl: string | null | undefined): string {
  return buildAuthenticatedAssetUrl(fileUrl);
}

function isImageLab(lab: { mimeType: string }): boolean {
  return lab.mimeType.startsWith("image/");
}

function toSavePayload(note: NoteFields): SaveNotePayload {
  return {
    caseId: note.caseId,
    hpi: note.hpi,
    exam: note.exam,
    assessment: note.assessment,
    treatmentPlan: note.treatmentPlan,
    medications: note.medications,
    allergies: note.allergies,
    familyHistory: note.familyHistory,
    socialHistory: note.socialHistory,
    procedures: note.procedures,
    diagnosis: note.diagnosis,
    labAndDiagnostics: note.labAndDiagnostics,
    codingAndBilling: note.codingAndBilling,
    learningIssues: note.learningIssues,
  };
}

// ─── Grades panel ─────────────────────────────────────────────────────────────

function GradesFeedbackPanel({ grades }: { grades: GradeNote[] }) {
  if (grades.length === 0) {
    return (
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          No submitted assignments yet. Submit a case from the Case Notes tab to see grades here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {grades.map((g) => (
          <Card key={g.id} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              {g.patient.patientName ?? g.patient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {g.patient.caseTitle || "No chief complaint listed"}
            </Typography>
            {g.submittedAt && (
              <Typography variant="body2" color="text.secondary">
                Submitted: {new Date(g.submittedAt).toLocaleDateString()}
              </Typography>
            )}
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {g.grade !== null ? (
                <Chip
                  label={`${g.grade} / 100`}
                  color="success"
                  size="medium"
                  sx={{ fontWeight: 700, fontSize: "1rem" }}
                />
              ) : (
                <Chip label="Pending Review" color="warning" size="medium" />
              )}
            </Box>
            {g.feedback && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: "#f7f9fc",
                  borderRadius: 1.5,
                  borderLeft: "3px solid #2196f3",
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Faculty Feedback
                </Typography>
                <Typography variant="body2">{g.feedback}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ─── Sidebar group ────────────────────────────────────────────────────────────

function CaseGroup({
  label,
  cases,
  selectedId,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  cases: PortalCase[];
  selectedId: number | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (c: PortalCase) => void;
}) {
  if (cases.length === 0) return null;

  return (
    <Box sx={{ mb: 0.5 }}>
      <ListItemButton onClick={onToggle} sx={{ borderRadius: 1.5, py: 0.75 }}>
        <ListItemText
          primary={label}
          slotProps={{ primary: { variant: "body2", fontWeight: 600, color: "text.secondary" } }}
        />
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>
      <Collapse in={open}>
        <List disablePadding sx={{ pl: 1 }}>
          {cases.map((c) => (
            <ListItemButton
              key={c.id}
              selected={selectedId === c.id}
              onClick={() => onSelect(c)}
              sx={{ borderRadius: 1.5, mb: 0.25 }}
            >
              <ListItemText
                primary={c.patientName ?? c.name}
                secondary={c.caseTitle || "No chief complaint listed"}
                slotProps={{
                  primary: { variant: "body2" },
                  secondary: { variant: "caption" },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Student() {
  const navigate = useNavigate();
  const isGuestUser = !getStoredToken();
  const appBarOffset = { xs: "56px", sm: "64px" };

  // ── cases & selection
  const [cases, setCases] = useState<PortalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PortalCase | null>(null);
  const [examSelected, setExamSelected] = useState(false);
  const [, setInteractionVersion] = useState(0);

  // ── current note form
  const [noteFields, setNoteFields] = useState<NoteFields>({ caseId: 0, hpi: "", exam: "" });
  const [caseLabs, setCaseLabs] = useState<StudentCaseLab[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState<string | null>(null);

  // ── tabs
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [grades, setGrades] = useState<GradeNote[]>([]);
  const [gradesLoaded, setGradesLoaded] = useState(false);

  // ── sidebar visibility toggle
  const [sidebarVisible] = useState(true);

  // ── sidebar collapse state
  const [sidebarOpen, setSidebarOpen] = useState({
    pblCase: true,
    pblLabs: true,
    simCase: true,
    simLabs: true,
  });

  // ── section collapse state
  const [openSections, setOpenSections] = useState<OpenSections>(DEFAULT_OPEN);

  // ── search
  const [search, setSearch] = useState("");

  // ── snackbars
  const [loginSuccessOpen, setLoginSuccessOpen] = useState(() => {
    const isFreshLogin = sessionStorage.getItem("emr_login_success") === "true";
    if (isFreshLogin) sessionStorage.removeItem("emr_login_success");
    return isFreshLogin;
  });
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);
  const [saveSnack, setSaveSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // ─── Mount: fetch assigned cases + show login notifications ──────────────
  useEffect(() => {
    let active = true;

    async function loadAssignedCases() {
      const token = getStoredToken();
      if (!token) {
        if (!active) return;
        setCases([]);
        setAssignmentNotice("Sign in to view your assigned cases.");
        return;
      }

      try {
        const { assignments } = await getStudentCases(token);
        if (!active) return;

        const caseList = assignments.map((a) => a.patient as PortalCase);
        setCases(caseList);

        const pbl = caseList.filter((c) => c.caseType === "pbl").length;
        const sim = caseList.filter((c) => c.caseType === "sim").length;

        if (caseList.length === 0) {
          setAssignmentNotice("No faculty cases assigned yet.");
        } else {
          setAssignmentNotice(`You have ${pbl} PBL case(s) and ${sim} SIM case(s) assigned.`);
        }
      } catch (err: unknown) {
        if (!active) return;

        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("not authenticated")) {
          setCases([]);
          setAssignmentNotice("Sign in to view your assigned cases.");
        } else {
          setCases([]);
          setAssignmentNotice("Could not load cases. Please check your connection.");
        }
      }
    }

    void loadAssignedCases();
    return () => {
      active = false;
    };
  }, []);

  // ─── Case selection ──────────────────────────────────────────────────────
  const handleCaseSelect = async (c: PortalCase) => {
    touchCase(c.id);
    setInteractionVersion((v) => v + 1);
    setSelectedCase(c);
    setExamSelected(false);
    setActiveTab(0);
    setNoteFields({ caseId: c.id, hpi: "", exam: "" });
    setCaseLabs([]);
    setLabsError(null);

    const token = getStoredToken();
    if (!token) {
      setLabsLoading(false);
      return;
    }

    setLabsLoading(true);

    const [noteResult, labsResult] = await Promise.allSettled([
      getNote(token, c.id),
      getStudentCaseLabs(token, c.id),
    ]);

    if (noteResult.status === "fulfilled" && noteResult.value) {
      setNoteFields(noteToFields(noteResult.value.note));
    }

    if (labsResult.status === "fulfilled") {
      setCaseLabs(labsResult.value.labs);
    } else {
      setLabsError(
        labsResult.reason instanceof Error ? labsResult.reason.message : "Failed to load labs."
      );
    }

    setLabsLoading(false);
  };

  // ─── Tab change ──────────────────────────────────────────────────────────
  const handleTabChange = (_: SyntheticEvent, newVal: 0 | 1) => {
    setActiveTab(newVal);
    if (newVal === 1 && !gradesLoaded) {
      const token = getStoredToken();
      if (token) {
        getStudentGrades(token)
          .then(({ notes }) => {
            setGrades(notes);
            setGradesLoaded(true);
          })
          .catch(() => {});
      }
    }
  };

  // ─── Section toggle ──────────────────────────────────────────────────────
  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Field update ────────────────────────────────────────────────────────
  const setField = (field: NoteField, value: string) => {
    setNoteFields((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Save notes ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const token = getStoredToken();
    if (!selectedCase) return;

    if (!token) {
      setSaveSnack({
        open: true,
        message: "Sign in to save notes.",
        severity: "info",
      });
      return;
    }

    try {
      const { note } = await saveNote(token, {
        ...toSavePayload(noteFields),
        caseId: selectedCase.id,
      });
      setNoteFields(noteToFields(note));
      setSaveSnack({ open: true, message: "Notes saved successfully.", severity: "success" });
    } catch (err) {
      setSaveSnack({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save notes.",
        severity: "error",
      });
    }
  };

  // ─── Submit assignment ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const token = getStoredToken();
    if (!token) {
      setSaveSnack({
        open: true,
        message: "Sign in to submit assignments.",
        severity: "info",
      });
      return;
    }

    if (!noteFields.id) return;

    try {
      const { note } = await submitNote(token, noteFields.id);
      setNoteFields(noteToFields(note));
      setGradesLoaded(false); // invalidate grades cache
      setSaveSnack({
        open: true,
        message: "Assignment submitted! Your instructor will review it shortly.",
        severity: "success",
      });
    } catch (err) {
      setSaveSnack({
        open: true,
        message: err instanceof Error ? err.message : "Failed to submit assignment.",
        severity: "error",
      });
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate(isGuestModeEnabled() ? "/portal" : "/login");
  };

  // ─── Derived sidebar groups ───────────────────────────────────────────────
  const filtered = cases.filter((c) =>
    (c.caseTitle || c.name).toLowerCase().includes(search.toLowerCase())
  );

  const pblCases = sortByLastInteracted(filtered.filter((c) => c.caseType === "pbl" && !c.hasLabs));
  const pblLabs  = sortByLastInteracted(filtered.filter((c) => c.caseType === "pbl" && c.hasLabs));
  const simCases = sortByLastInteracted(filtered.filter((c) => c.caseType === "sim" && !c.hasLabs));
  const simLabs  = sortByLastInteracted(filtered.filter((c) => c.caseType === "sim" && c.hasLabs));
  const showLabSection =
    !!selectedCase && (selectedCase.hasLabs || caseLabs.length > 0 || labsLoading || !!labsError);
  const selectedPatientName = selectedCase?.patientName ?? selectedCase?.name ?? "";
  const selectedChiefComplaint = selectedCase?.caseTitle || "No chief complaint listed";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      {/* ── Top AppBar ── */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}
      >
        <Toolbar>
          {/* <IconButton
            color="inherit"
            onClick={() => setSidebarVisible((v) => !v)} // just hiding this sidebar
            sx={{ mr: 1 }} // it is kind of pointless. b/c there is enough space 
          > // and there is no dynamic resizing when it is hidden, so it just leaves an empty gap. better to just let it be permanently visible for now.
            <MenuIcon /> 
          </IconButton> */}
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/student")}
          >
            EMR Student Dashboard
          </Typography>
          {isGuestModeEnabled() && (
            <Button
              color="inherit"
              onClick={() => navigate("/portal")}
              sx={{ mr: 1, textTransform: "none", fontWeight: 600 }}
            >
              Back
            </Button>
          )}
          {!isGuestModeEnabled() && (
            <Button
              color="inherit"
              startIcon={<SettingsIcon />}
              onClick={() => navigate("/settings")}
              sx={{ textTransform: "none", fontWeight: 600, mr: 1 }}
            >
              Settings
            </Button>
          )}
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* ── Left Sidebar ── */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarVisible}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              boxSizing: "border-box",
              borderRight: "1px solid #dbe4f0",
              bgcolor: "#ffffff",
              top: appBarOffset,
              height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
              overflowY: "auto",
              overscrollBehavior: "contain",
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 6 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "text.secondary" }}>
            MY CASES
          </Typography>

          <TextField
            fullWidth
            label="Search cases"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* PBL Cases section */}
          <Typography
            variant="overline"
            sx={{ px: 1, color: "#1a3a5c", fontWeight: 700, letterSpacing: 1 }}
          >
            PBL Cases
          </Typography>
          <List disablePadding sx={{ mb: 1 }}>
            <CaseGroup
              label="Case"
              cases={pblCases}
              selectedId={selectedCase?.id ?? null}
              open={sidebarOpen.pblCase}
              onToggle={() => setSidebarOpen((p) => ({ ...p, pblCase: !p.pblCase }))}
              onSelect={handleCaseSelect}
            />
            <CaseGroup
              label="Case with Labs"
              cases={pblLabs}
              selectedId={selectedCase?.id ?? null}
              open={sidebarOpen.pblLabs}
              onToggle={() => setSidebarOpen((p) => ({ ...p, pblLabs: !p.pblLabs }))}
              onSelect={handleCaseSelect}
            />
          </List>

          {/* SIM Cases section */}
          <Typography
            variant="overline"
            sx={{ px: 1, color: "#1a3a5c", fontWeight: 700, letterSpacing: 1 }}
          >
            SIM Cases
          </Typography>
          <List disablePadding>
            <CaseGroup
              label="Case"
              cases={simCases}
              selectedId={selectedCase?.id ?? null}
              open={sidebarOpen.simCase}
              onToggle={() => setSidebarOpen((p) => ({ ...p, simCase: !p.simCase }))}
              onSelect={handleCaseSelect}
            />
            <CaseGroup
              label="Case with Labs"
              cases={simLabs}
              selectedId={selectedCase?.id ?? null}
              open={sidebarOpen.simLabs}
              onToggle={() => setSidebarOpen((p) => ({ ...p, simLabs: !p.simLabs }))}
              onSelect={handleCaseSelect}
            />
          </List>

          {cases.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, mt: 1 }}>
              No cases assigned yet.
            </Typography>
          )}

          {/* Exams section */}
          <Box sx={{ mt: 2, borderTop: "1px solid #dbe4f0", pt: 2 }}>
            <Typography
              variant="overline"
              sx={{ px: 1, color: "#1a3a5c", fontWeight: 700, letterSpacing: 1 }}
            >
              Exams
            </Typography>
            <List disablePadding sx={{ mt: 0.5 }}>
              <ListItemButton
                selected={examSelected}
                onClick={() => { setExamSelected(true); setSelectedCase(null); }}
                sx={{ borderRadius: 1.5 }}
              >
                <ListItemText
                  primary="My Exams"
                  slotProps={{ primary: { variant: "body2" } }}
                />
              </ListItemButton>
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* ── Main Content ── */}
      <Box
        sx={{
          flex: 1,
          ml: sidebarVisible ? "280px" : 0,
          p: { xs: 2.5, sm: 4 },
          mt: appBarOffset,
          transition: "margin 0.2s ease",
        }}
      >
        {examSelected ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No Exam Available
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You will be notified when you receive an exam.
            </Typography>
          </Box>
        ) : !selectedCase ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {cases.length === 0
                ? isGuestUser
                  ? "Sign in to view your cases"
                  : "No assigned cases yet"
                : "Welcome to the EMR Student Portal"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {cases.length === 0
                ? isGuestUser
                  ? "This page now shows real faculty-assigned cases only."
                  : "Your assigned cases will appear here once faculty adds them."
                : "Select a case from the sidebar to begin."}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 900 }}>
            {/* ── Case Header ── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                src={
                  selectedCase.profilePictureUrl
                    ? resolveAssetUrl(selectedCase.profilePictureUrl)
                    : undefined
                }
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: 26,
                  bgcolor: "#1a3a5c",
                  border: "2px solid #dbe4f0",
                }}
              >
                {!selectedCase.profilePictureUrl && getInitials(selectedCase)}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {selectedPatientName}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {selectedChiefComplaint}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                  <Chip
                    label={selectedCase.caseType.toUpperCase()}
                    size="small"
                    color={selectedCase.caseType === "pbl" ? "primary" : "secondary"}
                  />
                  {selectedCase.hasLabs && (
                    <Chip label="Labs" size="small" variant="outlined" color="info" />
                  )}
                  {selectedCase.assignedByFaculty && (
                    <Chip
                      label={`Assigned by ${getDisplayName(selectedCase.assignedByFaculty)}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {noteFields.isSubmitted && (
                    <Chip label="Submitted" size="small" color="success" />
                  )}
                </Box>
              </Box>
            </Box>

            {/* ── Patient Info Card ── */}
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, bgcolor: "#f8fafc" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                  <Avatar
                    src={
                      selectedCase.profilePictureUrl
                        ? resolveAssetUrl(selectedCase.profilePictureUrl)
                        : undefined
                    }
                    sx={{ width: 88, height: 88, fontSize: 30, bgcolor: "#1a3a5c", border: "2px solid #dbe4f0" }}
                  >
                    {!selectedCase.profilePictureUrl && getInitials(selectedCase)}
                  </Avatar>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, flex: 1, minWidth: 280 }}>
                    {[
                      { label: "Patient Name", value: selectedPatientName },
                      { label: "Chief Complaint", value: selectedCase.caseTitle || "—" },
                      { label: "Date of Birth", value: selectedCase.dob ? new Date(selectedCase.dob).toLocaleDateString() : "—" },
                      { label: "Gender", value: selectedCase.gender || "—" },
                      { label: "Code Status", value: selectedCase.codeStatus || "—" },
                      { label: "Location", value: selectedCase.location || "—" },
                    ].map(({ label, value }) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* ── Tabs ── */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            >
              <Tab label="Case Notes" />
              <Tab label="Grades & Feedback" />
            </Tabs>

            {/* ── Tab 0: Case Notes ── */}
            {activeTab === 0 && (
              <>
                {noteFields.isSubmitted && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This assignment has been submitted. Your notes are now read-only.
                  </Alert>
                )}

                {noteFields.isSubmitted &&
                  (noteFields.feedback ||
                    (noteFields.grade !== null && noteFields.grade !== undefined)) && (
                  <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: "#f8fbff" }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Faculty Review
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                        {noteFields.grade !== null && noteFields.grade !== undefined ? (
                          <Chip label={`Grade: ${noteFields.grade} / 100`} color="success" />
                        ) : (
                          <Chip label="Pending grade" color="warning" />
                        )}
                        {noteFields.submittedAt && (
                          <Chip
                            label={`Submitted ${new Date(noteFields.submittedAt).toLocaleDateString()}`}
                            variant="outlined"
                          />
                        )}
                      </Box>
                      {noteFields.feedback ? (
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{noteFields.feedback}</Typography>
                      ) : (
                        <Typography color="text.secondary">
                          Your instructor has not left written feedback yet.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )}

                {showLabSection && (
                  <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: "#fbfcff" }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Released Labs
                      </Typography>
                      {labsError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {labsError}
                        </Alert>
                      )}

                      {labsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : caseLabs.length === 0 ? (
                        <Alert severity="info">
                          No labs have been released for this case yet.
                        </Alert>
                      ) : (
                        <Box sx={{ display: "grid", gap: 2 }}>
                          {caseLabs.map((lab) => (
                            <Card key={lab.id} variant="outlined" sx={{ borderRadius: 2 }}>
                              <CardContent>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  {lab.title}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    mt: 1,
                                    mb: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {lab.category && <Chip label={lab.category} size="small" />}
                                  <Chip label={lab.originalFilename} size="small" variant="outlined" />
                                  <Chip
                                    label={new Date(lab.createdAt).toLocaleDateString()}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                {lab.description && (
                                  <Typography sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
                                    {lab.description}
                                  </Typography>
                                )}
                                {isImageLab(lab) && (
                                  <Box
                                    component="img"
                                    src={resolveAssetUrl(lab.fileUrl)}
                                    alt={lab.title}
                                    sx={{
                                      width: "100%",
                                      maxHeight: 280,
                                      objectFit: "contain",
                                      borderRadius: 2,
                                      border: "1px solid #dbe4f0",
                                      bgcolor: "#f8fafc",
                                      mb: 2,
                                    }}
                                  />
                                )}
                                <Button
                                  variant="outlined"
                                  component="a"
                                  href={resolveAssetUrl(lab.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open Lab File
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {SECTIONS.map(({ key, label, field }) => (
                  <Box
                    key={key}
                    sx={{
                      mt: 2,
                      border: "1px solid #dbe4f0",
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "#fff",
                    }}
                  >
                    <Box
                      onClick={() => toggleSection(key)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "#f7f9fc",
                        "&:hover": { bgcolor: "#eef2f8" },
                      }}
                    >
                      <Typography fontWeight={600}>{label}</Typography>
                      {openSections[key] ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      )}
                    </Box>
                    <Collapse in={openSections[key]}>
                      <Box sx={{ p: 2 }}>
                        <TextField
                          multiline
                          rows={6}
                          fullWidth
                          value={(noteFields[field] as string) ?? ""}
                          onChange={(e) => setField(field, e.target.value)}
                          disabled={!!noteFields.isSubmitted}
                          placeholder={`Enter ${label.toLowerCase()}...`}
                        />
                      </Box>
                    </Collapse>
                  </Box>
                ))}

                <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isGuestUser || !!noteFields.isSubmitted}
                    sx={{ bgcolor: "#1a3a5c", "&:hover": { bgcolor: "#14304d" } }}
                  >
                    Save Notes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleSubmit}
                    disabled={isGuestUser || !noteFields.id || !!noteFields.isSubmitted}
                    color="success"
                  >
                    Submit Assignment
                  </Button>
                </Box>
              </>
            )}

            {/* ── Tab 1: Grades & Feedback ── */}
            {activeTab === 1 && <GradesFeedbackPanel grades={grades} />}
          </Box>
        )}
      </Box>

      {/* ── Snackbars ── */}

      {/* Login success toast */}
      <Snackbar
        open={loginSuccessOpen}
        autoHideDuration={3000}
        onClose={() => setLoginSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setLoginSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Successfully logged in!
        </Alert>
      </Snackbar>

      {/* Case assignment notice */}
      <Snackbar
        open={!!assignmentNotice}
        autoHideDuration={8000}
        onClose={() => setAssignmentNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAssignmentNotice(null)}
          severity={cases.length > 0 ? "info" : "warning"}
          variant="filled"
          sx={{ width: "100%", maxWidth: 500 }}
        >
          {assignmentNotice}
        </Alert>
      </Snackbar>

      {/* Save / submit feedback */}
      <Snackbar
        open={saveSnack.open}
        autoHideDuration={4000}
        onClose={() => setSaveSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSaveSnack((p) => ({ ...p, open: false }))}
          severity={saveSnack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {saveSnack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

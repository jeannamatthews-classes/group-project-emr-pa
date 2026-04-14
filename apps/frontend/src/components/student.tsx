import { useEffect, useState } from "react";
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
  Drawer,
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

import {
  getStudentCases,
  getNote,
  saveNote,
  submitNote,
  getStudentGrades,
} from "../services/casesApi";
import type { AssignedCase, NoteData, GradeNote, SaveNotePayload } from "../services/casesApi";
import { touchCase, sortByLastInteracted } from "../services/caseStorage";
import { logout, getStoredToken } from "../services/authApi";
import { mockCases } from "./Imports";

// ─── Section config ───────────────────────────────────────────────────────────

type SectionKey =
  | "hpi" | "med" | "exam" | "aller" | "assess"
  | "fhist" | "shist" | "proc" | "diag" | "lad"
  | "treat" | "cab" | "learn";

type NoteField = keyof SaveNotePayload;

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

type PortalCase = AssignedCase & {
  isExample?: boolean;
  mockCaseId?: number;
};

const EXAMPLE_CASES: PortalCase[] = mockCases.map((c, index) => ({
  id: -(index + 1),
  caseTitle: c.title,
  name: c.patient,
  caseType: "pbl",
  hasLabs: false,
  profilePictureUrl: null,
  isExample: true,
  mockCaseId: c.id,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(c: AssignedCase): string {
  const name = c.caseTitle || c.name;
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function noteToFields(note: NoteData): SaveNotePayload & { id?: string; isSubmitted?: boolean } {
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
              {g.patient.caseTitle || g.patient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient: {g.patient.name}
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
  cases: AssignedCase[];
  selectedId: number | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (c: AssignedCase) => void;
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
                primary={c.caseTitle || c.name}
                secondary={`Patient: ${c.name}`}
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

  // ── cases & selection
  const [cases, setCases] = useState<PortalCase[]>(EXAMPLE_CASES);
  const [selectedCase, setSelectedCase] = useState<PortalCase | null>(null);
  const [, setInteractionVersion] = useState(0);

  // ── current note form
  type NoteFields = SaveNotePayload & { id?: string; isSubmitted?: boolean };
  const [noteFields, setNoteFields] = useState<NoteFields>({ caseId: 0, hpi: "", exam: "" });

  // ── tabs
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [grades, setGrades] = useState<GradeNote[]>([]);
  const [gradesLoaded, setGradesLoaded] = useState(false);

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
    if (isFreshLogin) {
      sessionStorage.removeItem("emr_login_success");
    }
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
    const token = getStoredToken();
    if (!token) {
      navigate("/login");
      return;
    }

    getStudentCases(token)
      .then(({ assignments }) => {
        const caseList = assignments.map((a) => a.patient as PortalCase);
        const mergedCases = [...EXAMPLE_CASES, ...caseList];
        setCases(mergedCases);

        const pbl = caseList.filter((c) => c.caseType === "pbl").length;
        const sim = caseList.filter((c) => c.caseType === "sim").length;

        if (caseList.length === 0) {
          setAssignmentNotice("No faculty cases assigned yet. Example cases are still available.");
        } else {
          setAssignmentNotice(
            `You have ${pbl} PBL case(s) and ${sim} SIM case(s) assigned, plus example cases.`
          );
        }
      })
      .catch((err: unknown) => {
        // Only redirect to login on authentication errors
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("not authenticated")) {
          navigate("/login");
        } else {
          // Non-auth error (network, server down, etc.) — stay on page, show empty state
          setAssignmentNotice("Could not load cases. Please check your connection.");
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Case selection ──────────────────────────────────────────────────────
  const handleCaseSelect = async (c: PortalCase) => {
    touchCase(c.id);
    setInteractionVersion((v) => v + 1);
    setSelectedCase(c);
    setActiveTab(0);
    setNoteFields({ caseId: c.id, hpi: "", exam: "" });

    if (c.isExample) {
      // Keep examples visible but start with empty fields on student side.
      setNoteFields({ caseId: c.id, hpi: "", exam: "" });
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    try {
      const result = await getNote(token, c.id);
      if (result) {
        setNoteFields(noteToFields(result.note));
      }
    } catch {
      // No existing note — start fresh
    }
  };

  // ─── Tab change ──────────────────────────────────────────────────────────
  const handleTabChange = (_: React.SyntheticEvent, newVal: 0 | 1) => {
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
    if (!token || !selectedCase) return;

    if (selectedCase.isExample) {
      setSaveSnack({
        open: true,
        message: "Example cases are read-only samples.",
        severity: "info",
      });
      return;
    }

    try {
      const { note } = await saveNote(token, { ...noteFields, caseId: selectedCase.id });
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
    if (!token || !noteFields.id) return;

    if (selectedCase?.isExample) {
      setSaveSnack({
        open: true,
        message: "Example cases cannot be submitted.",
        severity: "error",
      });
      return;
    }

    try {
      const { note } = await submitNote(token, noteFields.id);
      setNoteFields((prev) => ({ ...prev, isSubmitted: note.isSubmitted }));
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
    navigate("/login");
  };

  // ─── Derived sidebar groups ───────────────────────────────────────────────
  const filtered = cases.filter((c) =>
    (c.caseTitle || c.name).toLowerCase().includes(search.toLowerCase())
  );

  const pblCases = sortByLastInteracted(filtered.filter((c) => c.caseType === "pbl" && !c.hasLabs));
  const pblLabs  = sortByLastInteracted(filtered.filter((c) => c.caseType === "pbl" && c.hasLabs));
  const simCases = sortByLastInteracted(filtered.filter((c) => c.caseType === "sim" && !c.hasLabs));
  const simLabs  = sortByLastInteracted(filtered.filter((c) => c.caseType === "sim" && c.hasLabs));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      {/* ── Top AppBar ── */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            EMR Student Portal
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate("/portal")}
            sx={{ mr: 1 }}
          >
            Back to Portal
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Exit
          </Button>
        </Toolbar>
      </AppBar>

      {/* ── Left Sidebar ── */}
      <Drawer
        variant="permanent"
        anchor="left"
        slotProps={{
          paper: {
            sx: {
              width: 280,
              boxSizing: "border-box",
              borderRight: "1px solid #dbe4f0",
              bgcolor: "#ffffff",
              mt: "64px", // offset for AppBar
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
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
        </Box>
      </Drawer>

      {/* ── Main Content ── */}
      <Box sx={{ flex: 1, ml: "280px", p: 4, mt: "64px" }}>
        {!selectedCase ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Welcome to the EMR Student Portal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a case from the sidebar to begin.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 900 }}>
            {/* ── Case Header ── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                src={
                  selectedCase.profilePictureUrl
                    ? `http://localhost:5001${selectedCase.profilePictureUrl}`
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
                  {selectedCase.caseTitle || selectedCase.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Patient: {selectedCase.name}
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
                  {noteFields.isSubmitted && (
                    <Chip label="Submitted" size="small" color="success" />
                  )}
                </Box>
              </Box>
            </Box>

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
                    disabled={!!noteFields.isSubmitted}
                    sx={{ bgcolor: "#1a3a5c", "&:hover": { bgcolor: "#14304d" } }}
                  >
                    Save Notes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleSubmit}
                    disabled={!noteFields.id || !!noteFields.isSubmitted}
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

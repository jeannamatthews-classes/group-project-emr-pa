import { useEffect, useState } from "react";
import type { Case } from "../Imports";
import { mockStudents, mockCases, mockAssignedCases, panelStyle } from "../Imports";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  Avatar,
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { getStoredToken } from "../../services/authApi";
import { facultyAssignCase, facultyCreateCase, facultyUploadCasePicture, facultyListStudents, type FacultyStudent } from "../../services/facultyApi";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function StudentPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [students, setStudents] = useState<FacultyStudent[]>([]);
    const [assigningCaseId, setAssigningCaseId] = useState<number | null>(null);
    const [assignMessage, setAssignMessage] = useState<string | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [caseSearch, setCaseSearch] = useState("");
    const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

    // ── Assign New Case dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [picturePreview, setPicturePreview] = useState<string | null>(null);
    const [newCase, setNewCase] = useState({
        name: "",
        chiefComplaint: "",
        dob: "",
        gender: "Other",
        codeStatus: "Full Code",
        location: "",
        caseType: "pbl",
    });

    function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setPictureFile(file);
        setPicturePreview(file ? URL.createObjectURL(file) : null);
    }

    function resetDialog() {
        setNewCase({ name: "", chiefComplaint: "", dob: "", gender: "Other", codeStatus: "Full Code", location: "", caseType: "pbl" });
        setPictureFile(null);
        setPicturePreview(null);
        setAssignError(null);
        setSubmitting(false);
    }

    async function handleCreateAndAssign() {
        if (!newCase.name.trim()) {
            setAssignError("Patient name is required.");
            return;
        }
        if (!selectedDbStudent) {
            setAssignError("No student selected.");
            return;
        }
        const token = getStoredToken();
        if (!token) { setAssignError("Not logged in."); return; }

        try {
            setSubmitting(true);
            setAssignError(null);
            const { case: created } = await facultyCreateCase(token, {
                name: newCase.name.trim(),
                caseTitle: newCase.chiefComplaint.trim() || newCase.name.trim(),
                dob: newCase.dob || undefined,
                gender: newCase.gender,
                codeStatus: newCase.codeStatus,
                location: newCase.location.trim() || undefined,
                caseType: newCase.caseType,
            });
            if (pictureFile) {
                await facultyUploadCasePicture(token, created.id, pictureFile);
            }
            await facultyAssignCase(token, { patientId: created.id, studentId: selectedDbStudent.id });
            setAssignMessage(`Case "${newCase.name}" assigned to ${selectedDbStudent.username}.`);
            setAssignDialogOpen(false);
            resetDialog();
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : "Failed to create and assign case.");
        } finally {
            setSubmitting(false);
        }
    }

    const [studentSearch, setStudentSearch] = useState("");
    const filteredStudents = mockStudents.filter((s) =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );

    useEffect(() => {
        let active = true;

        async function loadStudents() {
            try {
                const token = getStoredToken();
                if (!token) return;
                const { students: nextStudents } = await facultyListStudents(token);
                if (!active) return;
                setStudents(nextStudents);
            } catch (error) {
                if (!active) return;
                console.error("Failed to load faculty students", error);
            }
        }

        void loadStudents();
        return () => {
            active = false;
        };
    }, []);

    if(!studentId) return null;

    const dbStudents = students.map((s) => ({ id: s.id, name: s.username }));
    const displayStudents = dbStudents.length > 0 ? dbStudents : mockStudents;

    const student = displayStudents.find((s) => String(s.id) === studentId);
    if(!student) return null; 

    const numericId = Number(student.id);
    const mappedMockStudentId = Number.isInteger(numericId)
        ? ((numericId - 1 + mockStudents.length) % mockStudents.length) + 1
        : (Array.from(String(student.id)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % mockStudents.length) + 1;

    const assigned = mockAssignedCases.filter(ac => ac.studentId === mappedMockStudentId);
    const studentCases = mockAssignedCases
        .filter((ac) => ac.studentId === mappedMockStudentId)
        .map((ac) => mockCases.find((c) => c.id === ac.caseId))
        .filter((c): c is Case => Boolean(c));

    const selectedDbStudent = students.find((s) => s.id === String(student.id));

    const selectedCase =
        studentCases.find((c) => c.id === selectedCaseId) || null;

    async function handleAssignCase(caseId: number) {
        if (!selectedDbStudent) {
            setAssignError("Please select a DB student to assign this case.");
            setAssignMessage(null);
            return;
        }

        const token = getStoredToken();
        if (!token) {
            setAssignError("You are not logged in.");
            setAssignMessage(null);
            return;
        }

        try {
            setAssigningCaseId(caseId);
            setAssignError(null);
            setAssignMessage(null);
            await facultyAssignCase(token, {
                patientId: caseId,
                studentId: selectedDbStudent.id,
            });
            setAssignMessage(`Assigned case ${caseId} to ${selectedDbStudent.username}.`);
        } catch (error) {
            setAssignError(error instanceof Error ? error.message : "Failed to assign case");
        } finally {
            setAssigningCaseId(null);
        }
    }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}
            >
                <Toolbar>
                <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                    Student Manager
                </Typography>

                <Button color="inherit" sx={{ textTransform: "none", fontWeight: 600 }} onClick={() => navigate("/faculty")}>
                    Back
                </Button>
            
                <Button
                    color="inherit"
                    startIcon={<LogoutIcon />}
                    onClick={() => navigate("/login")}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                >
                    Exit
                </Button>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                anchor="left"
                sx={{
                    "& .MuiDrawer-paper": {
                    width: 300,
                    mt: "64px",
                    bgcolor: "#ffffff",
                    borderRight: "1px solid #dbe4f0",
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            
                        }}
                    >
                        <Typography
                            variant="overline"
                            sx={{ color: "#1a3a5c", fontWeight: 700 }}
                        >
                            Students
                        </Typography>
        
                    </Box>
            
                    <TextField
                        fullWidth
                        size="small"
                        label="Search students"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        sx={{ mb: 1 }}
                    />
            
                    <List dense>
                        {filteredStudents.map((student) => (
                            <ListItemButton
                                key={student.id}
                                onClick={() => navigate(`/student/${student.id}`)}
                                sx={{ borderRadius: 1.5, mb: 0.5 }}
                            >
                                <ListItemText primary={student.name} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>

                <Box sx={{ p: 2 }}>
                    
                    <Typography
                        variant="overline"
                        sx={{ color: "#1a3a5c", fontWeight: 700 }}
                    >
                        {student.name}'s Assigned Cases
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        label="Search cases"
                        value={caseSearch}
                        onChange={(e) => setCaseSearch(e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    <List dense>
                        {studentCases.map((c) => (
                        <ListItemButton
                            key={c.id}
                            onClick={() => setSelectedCaseId(c.id)}                        
                        >
                            <ListItemText primary={c.title} secondary={c.patient} />
                        </ListItemButton>
                        ))}
                    </List>
                        
                </Box>
            </Drawer>

            <Box sx={{ flex: 1, ml: "300px", mt: "64px", p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h4" fontWeight={700}>
                        {student.name}
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        sx={{ bgcolor: "#1a3a5c", fontWeight: 700, px: 3 }}
                        onClick={() => { setAssignDialogOpen(true); setAssignMessage(null); setAssignError(null); }}
                    >
                        + Assign New Case
                    </Button>
                </Box>

                {assignMessage && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: "#e8f5e9", borderRadius: 1, color: "#2e7d32", fontWeight: 500 }}>
                        {assignMessage}
                    </Box>
                )}

                {!selectedCase ? (
                    <Typography color="text.secondary">
                        Select a case from the sidebar to view submissions.
                    </Typography>
                ) : (
                    <Box>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Patient: {selectedCase.patient}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Chief Complaint: {selectedCase.title}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Assign New Case Dialog ── */}
            <Dialog open={assignDialogOpen} onClose={() => { if (!submitting) { setAssignDialogOpen(false); resetDialog(); } }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, bgcolor: "#1a3a5c", color: "#fff" }}>
                    Assign New Case to {student.name}
                </DialogTitle>
                <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
                    {/* Photo upload */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={picturePreview ?? undefined} sx={{ width: 72, height: 72, bgcolor: "#dbe4f0" }} />
                        <Button variant="outlined" component="label" size="small">
                            Upload Photo (optional)
                            <input type="file" accept="image/*" hidden onChange={handlePictureChange} />
                        </Button>
                    </Box>

                    <TextField
                        label="Patient Name"
                        required
                        fullWidth
                        value={newCase.name}
                        onChange={(e) => setNewCase((p) => ({ ...p, name: e.target.value }))}
                    />
                    <TextField
                        label="Chief Complaint"
                        fullWidth
                        value={newCase.chiefComplaint}
                        onChange={(e) => setNewCase((p) => ({ ...p, chiefComplaint: e.target.value }))}
                    />
                    <TextField
                        label="Date of Birth"
                        type="date"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={newCase.dob}
                        onChange={(e) => setNewCase((p) => ({ ...p, dob: e.target.value }))}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select label="Gender" value={newCase.gender} onChange={(e) => setNewCase((p) => ({ ...p, gender: e.target.value }))}>
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Code Status</InputLabel>
                        <Select label="Code Status" value={newCase.codeStatus} onChange={(e) => setNewCase((p) => ({ ...p, codeStatus: e.target.value }))}>
                            <MenuItem value="Full Code">Full Code</MenuItem>
                            <MenuItem value="DNR">DNR</MenuItem>
                            <MenuItem value="DNI">DNI</MenuItem>
                            <MenuItem value="DNR-DNI">DNR-DNI</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Location"
                        fullWidth
                        value={newCase.location}
                        onChange={(e) => setNewCase((p) => ({ ...p, location: e.target.value }))}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Case Type</InputLabel>
                        <Select label="Case Type" value={newCase.caseType} onChange={(e) => setNewCase((p) => ({ ...p, caseType: e.target.value }))}>
                            <MenuItem value="pbl">PBL</MenuItem>
                            <MenuItem value="sim">SIM</MenuItem>
                        </Select>
                    </FormControl>

                    {assignError && (
                        <Box sx={{ color: "error.main", fontSize: 14 }}>{assignError}</Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setAssignDialogOpen(false); resetDialog(); }} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: "#1a3a5c" }}
                        onClick={handleCreateAndAssign}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {submitting ? "Assigning…" : "Create & Assign"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
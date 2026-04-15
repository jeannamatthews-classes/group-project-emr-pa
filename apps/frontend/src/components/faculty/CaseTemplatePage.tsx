import { useState, useEffect } from "react";
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
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { mockCases, mockStudents } from "../Imports";

type SectionKey =
  | "hpi" | "med" | "aller" | "medhis" | "famhis"
  | "sochist" | "ros" | "exam" | "lab" | "diag" | "treat"
  | "follow" | "bill" | "desmake" | "learn";

  type NoteField =
  | "hpi"
  | "medications"
  | "allergies"
  | "medicalHistory"
  | "familyHistory"
  | "socialHistory"
  | "reviewOfSystems"
  | "physicalExam"
  | "labAndDiagnostics"
  | "diagnosisAssessment"
  | "treatment"
  | "followUp"
  | "codingAndBilling"
  | "decisionMaking"
  | "learningIssues";

const SECTIONS: { key: SectionKey; label: string; field: NoteField }[] = [
  { key: "hpi", label: "HPI", field: "hpi" },
  { key: "med", label: "Medications", field: "medications" },
  { key: "aller", label: "Allergies", field: "allergies" },
  { key: "medhis", label: "Medical History", field: "medicalHistory" },
  { key: "famhis", label: "Family History", field: "familyHistory" },
  { key: "sochist", label: "Social History", field: "socialHistory" },
  { key: "ros", label: "Review of Systems", field: "reviewOfSystems" },
  { key: "exam", label: "Physical Exam", field: "physicalExam" },
  { key: "lab", label: "Lab and Diagnostics", field: "labAndDiagnostics" },
  { key: "diag", label: "Diagnosis / Assessment", field: "diagnosisAssessment" },
  { key: "treat", label: "Treatment Plan", field: "treatment" },
  { key: "follow", label: "Follow Up", field: "followUp" },
  { key: "bill", label: "Coding and Billing", field: "codingAndBilling" },
  { key: "desmake", label: "Decision Making", field: "decisionMaking" },
  { key: "learn", label: "Learning Issues", field: "learningIssues" },
];

type OpenSections = Record<SectionKey, boolean>;
const DEFAULT_OPEN: OpenSections = {
  hpi: true,
  med: false,
  aller: false,
  medhis: false,
  famhis: false,
  sochist: false,
  ros: false,
  exam: false,
  lab: false,
  diag: false,
  treat: false,
  follow: false,
  bill: false,
  desmake: false,
  learn: false,
};

export default function FacultyCaseTemplatePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [caseSearch, setCaseSearch] = useState("");


  const caseFromState = location.state;

  const isNew = caseId === "new";
  const caseData =
    isNew ? {
      id: "new",
      title: "",
      patient: "",
    }
    : mockCases.find((c) => String(c.id) === String(caseId)) || null;

  const [activeTab, setActiveTab] = useState(0);

  const [openSections, setOpenSections] = useState<OpenSections>(DEFAULT_OPEN);

  const [caseFields, setCaseFields] = useState<any>({
    title: caseData?.title || "",
    patient: caseData?.patient || "",

    hpi: "",
    medications: "",
    allergies: "",
    medicalHistory: "",
    familyHistory: "",
    socialHistory: "",
    reviewOfSystems: "",
    physicalExam: "",
    labAndDiagnostics: "",
    diagnosisAssessment: "",
    treatment: "",
    followUp: "",
    codingAndBilling: "",
    decisionMaking: "",
    learningIssues: "",
  });

  const [assigned, setAssigned] = useState<number[]>([]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setField = (field: NoteField, value: string) => {
    setCaseFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleStudent = (studentId: number) => {
    setAssigned((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = () => {
    console.log("Saving case template:", caseFields);
  };

  const handleSaveAssignments = () => {
    console.log("Assigned students:", assigned);
  };

  console.log("route id:", caseId);
  console.log("available cases:", mockCases);

  if (!caseData) {
    return (
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" color="error">
            Case not found
          </Typography>

          <Typography sx={{ mt: 1 }}>
            Route ID: {caseId}
          </Typography>

          <Button onClick={() => navigate("/faculty")}>
            Back to Faculty Dashboard
          </Button>
        </Box>
      );
    }
  useEffect(() => {
    if(!caseData) return;

    setCaseFields({
      title: caseData.title || "",
      patient: caseData.patient || "",

      hpi: "",
      medications: "",
      allergies: "",
      medicalHistory: "",
      familyHistory: "",
      socialHistory: "",
      reviewOfSystems: "",
      physicalExam: "",
      labAndDiagnostics: "",
      diagnosisAssessment: "",
      treatment: "",
      followUp: "",
      codingAndBilling: "",
      decisionMaking: "",
      learningIssues: "",
    });
    
  }, [caseId]);


  return (
    /* Top Bar */
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Faculty Case Manager
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
              sx={{ color: "#1a3a5c", fontWeight: 700, display: "block" }}
            >
              Cases
            </Typography>

            <Button
              size="small"
              variant="contained"
              sx={{
                textTransform: "none",
                fontSize: "0.65rem",
                py: 0.2,
                px: 1,
                minWidth: 0,
                lineHeight: 1.2,
                bgcolor: "#1a3a5c",
                "&:hover": { bgcolor: "#14304d" },
              }}
              onClick={() => navigate("/caseTemplate/new")}
            >
              + New Case
            </Button>
          </Box>

          <TextField
              fullWidth
              size="small"
              label="Search cases"
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              sx={{ mb: 1 }}
            />

          <List dense>
            {mockCases.map((c) => (
              <ListItemButton 
                key={c.id}
                selected={String(c.id) === String(caseData?.id)}
                onClick={() => { navigate(`/caseTemplate/${c.id}`);}}
              >
                <ListItemText primary={c.title} secondary={c.patient} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, ml: "300px", mt: "64px", p: 4 }}>
          <Box sx={{ maxWidth: 900 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: "#1a3a5c", width: 72, height: 72 }}>
                {caseFields.title[0]}
              </Avatar>

              <Box>
                <TextField
                  variant="standard"
                  value={caseFields.title}
                  onChange={(e) => setCaseFields((p:  any) => ({ ...p, title: e.target.value }))}
                  placeholder="Case Title"
                />
                <Typography color="text.secondary">
                  Patient:{" "}
                  <TextField
                    variant="standard"
                    value={caseFields.patient}
                    onChange={(e) => setCaseFields((p: any) => ({ ...p, patient: e.target.value }))}
                    placeholder="Patient Name"
                  />
                </Typography>
              </Box>
            </Box>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Case Template" />
              <Tab label="Assign Students" />
            </Tabs>

            {activeTab === 0 && (
              <>
                {SECTIONS.map(({ key, label, field }) => (
                  <Box key={key} sx={{ mt: 2, border: "1px solid #dbe4f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff", }}>
                    <Box onClick={() => toggleSection(key)} sx={{ p: 2, cursor: "pointer", display: "flex", justifyContent: "space-between", bgcolor: "#f7f9fc", }}>
                      <Typography fontWeight={600}>
                        {label}
                      </Typography>
                      {openSections[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>

                    <Collapse in={openSections[key]}>
                      <Box sx={{ p: 2 }}>
                        <TextField
                          multiline
                          rows={6}
                          fullWidth
                          value={caseFields[field] || ""}
                          onChange={(e) =>
                            setField(field, e.target.value)
                          }
                          placeholder={`Enter ${label.toLowerCase()}...`}
                        />
                      </Box>
                    </Collapse>
                  </Box>
                ))}
                <Button variant="contained" sx={{ mt: 3, bgcolor: "#1a3a5c" }} onClick={handleSave}>
                  Save Case
                </Button>
              </>
            )}

            {activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Assign Students
              </Typography>

              <List>
                {mockStudents.map((s) => (
                  <ListItemButton
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <Checkbox checked={assigned.includes(s.id)} />
                    <ListItemText primary={s.name} />
                  </ListItemButton>
                ))}
              </List>

              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: "#1a3a5c" }}
                onClick={handleSaveAssignments}
              >
                Save Assignments
              </Button>
            </Box>
          )}

          </Box>
      </Box>
    </Box>
  );
}

// import { useParams, useNavigate } from "react-router-dom";
// import { Box, Button, Typography } from "@mui/material";

// export default function CaseTemplatePage() {
//     const { caseId } = useParams<{ caseId: string }>();
//     const navigate = useNavigate();

//     if(!caseId) return null;
 
//     return (
//       <Box p={4}>
//         <Button onClick={() => navigate("/faculty")}>
//           Back
//         </Button>

//         <Typography variant="h5" sx={{ mt: 2}}>
//           Case Template (ID: {caseId})
//         </Typography>
//       </Box>
//     );
// }
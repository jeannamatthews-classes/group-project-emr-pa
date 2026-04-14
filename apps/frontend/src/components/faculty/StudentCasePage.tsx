import { useParams, useNavigate } from "react-router-dom";
import { mockCases, mockStudentResponses, mockStudents } from "../Imports";
import { Box, Button, Typography, Drawer, List, ListItemButton, ListItemText, Divider, Paper } from "@mui/material";

const SIDEBAR_SECTIONS = [
  { key: "hpi", label: "HPI" },
  { key: "history", label: "History" },
  { key: "meds", label: "Medications & Allergies" },
  { key: "ros", label: "Review of Systems" },
  { key: "exam", label: "Physical Exam" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "assessment", label: "Assessment" },
  { key: "treatment", label: "Treatment" },
  { key: "coding", label: "Coding & Billing" },
  { key: "notes", label: "Notes" },
] as const;

export default function StudentCasePage() {
  const { caseId, studentId } = useParams<{ caseId: string; studentId: string }>();
  const navigate = useNavigate();

  if (!caseId || !studentId) return null;

  const caseData = mockCases.find(c => c.id === parseInt(caseId));
  const numericStudentId = Number(studentId);
  const studentPoolSize = Math.max(1, mockStudents.length);
  const mappedMockStudentId = Number.isInteger(numericStudentId)
    ? ((numericStudentId - 1 + studentPoolSize) % studentPoolSize) + 1
    : (Array.from(studentId).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % studentPoolSize) + 1;
  const response = mockStudentResponses.find(
    r => r.caseId === parseInt(caseId) && r.studentId === mappedMockStudentId);

  if (!caseData) return null;

  return (
    <Box
      sx={{
        bgcolor: "#f4f7fb",
        height: "100vh",
        display: "flex",
      }}
    >
      <Drawer
        variant="permanent"
        anchor="left"
        PaperProps={{
          sx: {
            width: 280,
            borderRight:"1px solid #dbe4f0",
            bgcolor: "#fff",
            p: 2
          },
        }}
      >
        <Button onClick={() => navigate(`/student/${studentId}`)} sx={{ mb: 2 }}>
          Back
        </Button>

        <Typography variant="h6" fontWeight={700}>
          Case Sections
        </Typography>

        <List sx={{ mt: 2 }}>
          {SIDEBAR_SECTIONS.map((section) => (
            <ListItemButton key={section.key}>
              <ListItemText primary={section.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      
      <Box sx={{ flex: 1, ml: "280px", p: 4 }}>
        <Typography variant="h5" fontWeight={600}>
          Student: {studentId}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          Patient: {caseData.patient}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
          DOB: {/*future dob field*/} | Gender: {/*future gender field*/}| Chief Complaint: {caseData.title}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {!response ? (
          <Typography color="text.secondary">
            No submission yet.
          </Typography>
        ) : ( 
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>HPI</Typography>
              <Typography>{response.hpi}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>History</Typography>
              <Typography>Medical: {response.history.medical}</Typography>
              <Typography>Family: {response.history.family}</Typography>
              <Typography>Social: {response.history.social}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Medications</Typography>
              <Typography>{response.medications}</Typography>

              <Typography fontWeight={700} sx={{ mt: 1 }}>
                Allergies
              </Typography>
              <Typography>{response.allergies}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Review of Systems</Typography>
              <Typography>{response.ros}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Physical Exam</Typography>
              <Typography>{response.exam}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Procedures</Typography>
              <Typography>{response.procedures}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Labs & Diagnostics</Typography>
              <Typography>{response.diagnostics}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Diagnosis</Typography>
              <Typography>{response.assessment}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Treatment</Typography>
              <Typography>{response.treatment}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Coding & Billing</Typography>
              <Typography>{response.codingBilling}</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={700}>Notes</Typography>
              <Typography>{response.notes}</Typography>
            </Paper>

          </Box>
        )}
      </Box>
    </Box>
  );
}
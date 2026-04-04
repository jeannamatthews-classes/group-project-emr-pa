import { useState } from "react";

import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

type Student = {
  id: number;
  name: string;
};

type Case = {
  id: number;
  title: string;
  patient: string;
  studentId: number;
};

const mockStudents: Student[] = [
  { id: 1, name: "Ricky Bobby" },
  { id: 2, name: "Forrest Gump" },
];

const mockCases: Case[] = [
  { id: 1, title: "Chest Pain", patient: "John Doe", studentId: 1 },
  { id: 1, title: "Bones Itchy", patient: "Jane Smith", studentId: 2 },
];

const panelStyle = {
  bgcolor: "#ffffff",
  borderRadius: 3,
  p: 2.5,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  flex: 1,
  display: "flex",
  flexDirection: "column"
};

export default function FacultyDashboard() {
  const [studentSearch, setStudentSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const filteredStudents = mockStudents.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredCases = mockCases
    .filter((c) => !selectedStudent || c.studentId === selectedStudent.id)
    .filter((c) => c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  return (
    <Box
      sx={{
        bgcolor: "#f4f7fb",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 4, pt: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Faculty Dashboard
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          flex: 1,
          px: 4,
          pb: 4,
          width: "100%",
        }}
      >
        <Box sx={panelStyle}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Students
          </Typography>

          <TextField
            fullWidth
            label="Search Students"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            size="small"
          />

          <List sx={{ mt: 2, overflowY: "auto", flex: 1 }}>
            {filteredStudents.map((student) => (
              <ListItemButton 
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                selected={selectedStudent?.id === student.id}
                sx={{ borderRadius: 2, mb: 1 }}
                >
                <ListItemText primary={student.name}/>
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={panelStyle}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Cases
          </Typography>

          <TextField
            fullWidth
            label="Search Cases"
            value={caseSearch}
            onChange={(e) => setCaseSearch(e.target.value)}
            size="small"
          />

          <List sx={{ mt: 2, overflowY: "auto", flex: 1 }}>
            {filteredCases.map((c) => (
              <ListItemButton 
                key={c.id}
                onClick={() => setSelectedCase(c)}
                selected={selectedCase?.id === c.id}
                sx={{ borderRadius: 2, mb: 1 }}
                >
                <ListItemText
                  primary={c.title}
                  secondary={c.patient}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

      </Box>
    </Box>
  );
}
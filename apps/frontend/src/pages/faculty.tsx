import { useState } from "react";

import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import LogoutButton from "../components/LogoutButton";
import UserNameBadge from "../components/UserNameBadge";

type View =
  | { type: "main" }
  | { type: "student"; studentId: number }
  | { type: "studentCase"; caseId: number }
  | { type: "caseTemplate"; caseId: number }

type Student = {
  id: number;
  name: string;
};

type Case = {
  id: number;
  title: string;
  patient: string;
};

type AssignedCase = {
  id: number;
  caseId: number;
  studentId: number;
}

const mockStudents: Student[] = [
  { id: 1, name: "Ricky Bobby" },
  { id: 2, name: "Forrest Gump" },
];

const mockCases: Case[] = [
  { id: 1, title: "Chest Pain", patient: "John Doe" },
  { id: 2, title: "Bones Itchy", patient: "Jane Smith" },
];

const mockAssignedCases: AssignedCase[] = [
  { id: 1, caseId: 1, studentId: 1 },
  { id: 2, caseId: 1, studentId: 2 },
  { id: 3, caseId: 2, studentId: 2 },
]

const panelStyle = {
  bgcolor: "#ffffff",
  borderRadius: 3,
  p: 2.5,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const actionButtonSx = {
  borderRadius: 2,
  textTransform: "none",
  px: 2,
  fontWeight: 600,
};

export default function FacultyDashboard() {
  const [view, setView] = useState<View>({ type: "main" });

  const [studentSearch, setStudentSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const filteredStudents = mockStudents.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredCases = mockCases.filter((c) =>c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  if (view.type === "student") {
    const student = mockStudents.find(s => s.id === view.studentId);
    
    const assigned = mockAssignedCases.filter(ac => ac.studentId === student?.id);
    const casesForStudent = assigned.map(ac => mockCases.find(c => c.id === ac.caseId)).filter(Boolean);

    return (
      <Box 
        sx={{ 
          bgcolor: "#f4f7fb",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
            <UserNameBadge />
            <LogoutButton variant="outlined" size="small" />
          </Box>
          <Button 
            variant="outlined"
            size="small"
            onClick={() => setView({ type: "main"})}
            sx={{ ...actionButtonSx, mb: 2 }}
          >
            Back
          </Button>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            {student?.name}
          </Typography>
        </Box>

        <Box 
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            flex: 1,
            px: { xs: 2, md: 4 },
            pb: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box sx={panelStyle}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Assigned Cases
            </Typography>

            <List>
              {casesForStudent.map(c => (
                  <ListItemButton
                    key={c!.id}
                    onClick={() => setView({ type: "studentCase", caseId: c!.id})}
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemText
                      primary={c!.title}
                      secondary={c!.patient}/>
                  </ListItemButton>
                ))
              }
            </List>
          </Box>

          <Box sx={panelStyle}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Students
            </Typography>

            <List>
              {mockStudents.map(s => (
                <ListItemButton
                  key={s.id}
                  selected={s.id === student?.id}
                  onClick={() => setView({ type: "student", studentId: s.id })}
                >
                  <ListItemText primary={s.name}/>
                </ListItemButton>
              ))}
            </List>
          </Box>

        </Box>
      </Box>
    );
  }

  if (view.type === "studentCase") {
    const caseDetail = mockCases.find(c => c.id === view.caseId);
    const assignedStudent = mockAssignedCases.find(ac => ac.caseId === view.caseId);
    const student = mockStudents.find(s => s.id === assignedStudent?.studentId);
  
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f4f7fb", boxSizing: "border-box", overflowX: "hidden" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
          <UserNameBadge />
          <LogoutButton variant="outlined" size="small" />
        </Box>
        <Button 
            variant="outlined"
            size="small"
            onClick={() => setView({ type: "main" })}
            sx={{ ...actionButtonSx, mb: 2 }}
          >
            Back
          </Button>

          <Typography variant="h5" sx={{ mt: 2 }}>
            {caseDetail?.title}
          </Typography>

          <Typography variant="h5" sx={{ mt: 2 }}>
            Patient: {caseDetail?.patient}
          </Typography>

          <Typography variant="h5" sx={{ mt: 2 }}>
            Assigned to: {student?.name}
          </Typography>
      </Box>
    )
  }

  if (view.type === "caseTemplate") {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f4f7fb", boxSizing: "border-box", overflowX: "hidden" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
          <UserNameBadge />
          <LogoutButton variant="outlined" size="small" />
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setView({ type: "main"})}
          sx={actionButtonSx}
        >
          Back
        </Button>

        <Typography variant="h5" sx={{ mt: 2}}>
          Case Template (ID: {view.caseId})
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#f4f7fb",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
          <UserNameBadge />
          <LogoutButton variant="outlined" size="small" />
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Faculty Dashboard
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          flex: 1,
          px: { xs: 2, md: 4 },
          pb: 4,
          width: "100%",
          boxSizing: "border-box",
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
                onClick={() => setView({ type: "student", studentId: student.id })}
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
                onClick={() => setView({ type: "caseTemplate", caseId: c.id})}
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
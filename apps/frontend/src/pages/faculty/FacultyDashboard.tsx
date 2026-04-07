import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Student, Case, AssignedCase } from "../components/Imports";
import { mockStudents, mockCases, mockAssignedCases, panelStyle } from "../components/Imports";
import { Box, Button, List, ListItemButton, ListItemText, Typography, TextField } from "@mui/material";

export default function FacultyDashboard() {
  const [studentSearch, setStudentSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const navigate = useNavigate();
  const filteredStudents = mockStudents.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredCases = mockCases.filter((c) =>c.title.toLowerCase().includes(caseSearch.toLowerCase()));

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
                onClick={() => navigate(`/student/${student.id}`) }
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
                sx={{ borderRadius: 2, mb: 1 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%"
                  }}
                >
                  <Box>
                    <Typography variant="body1">{c.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{c.patient}</Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/caseTemplate/${c.id}`)}
                  >
                    Edit
                  </Button>
                </Box>
              </ListItemButton>
            ))}
          </List>
        </Box>

      </Box>
    </Box>
  );
}
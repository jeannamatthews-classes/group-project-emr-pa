import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyCase, FacultyStudent } from "../../services/facultyApi";

type FacultyDashboardSidebarProps = {
  studentSearch: string;
  caseSearch: string;
  students: FacultyStudent[];
  cases: FacultyCase[];
  onStudentSearchChange: (value: string) => void;
  onCaseSearchChange: (value: string) => void;
  onStudentSelect: (studentId: string) => void;
  onCaseSelect: (caseId: number) => void;
};

export default function FacultyDashboardSidebar({
  studentSearch,
  caseSearch,
  students,
  cases,
  onStudentSearchChange,
  onCaseSearchChange,
  onStudentSelect,
  onCaseSelect,
}: FacultyDashboardSidebarProps) {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        "& .MuiDrawer-paper": {
          width: 320,
          mt: "64px",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          bgcolor: "#ffffff",
          borderRight: "1px solid #dbe4f0",
        },
      }}
    >
      <Box sx={{ p: 3, pb: 4 }}>
        <Typography variant="overline" sx={{ color: "#1a3a5c", fontWeight: 700 }}>
          Students
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search students"
          value={studentSearch}
          onChange={(event) => onStudentSearchChange(event.target.value)}
          sx={{ mb: 2.25 }}
        />

        <List sx={{ mb: 3, p: 0 }}>
          {students.map((student) => (
            <ListItemButton
              key={student.id}
              onClick={() => onStudentSelect(student.id)}
              sx={{ borderRadius: 1.5, mb: 0.75, alignItems: "flex-start", px: 1.5, py: 1.25 }}
            >
              <ListItemText
                primary={getDisplayName(student)}
                secondary={`${student.assignmentCount} assigned - ${student.submittedCount} submitted`}
                primaryTypographyProps={{ fontSize: "1rem", fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: "0.95rem" }}
              />
            </ListItemButton>
          ))}
        </List>

        <Typography variant="overline" sx={{ color: "#1a3a5c", fontWeight: 700 }}>
          Cases
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search cases"
          value={caseSearch}
          onChange={(event) => onCaseSearchChange(event.target.value)}
          sx={{ mb: 2.25 }}
        />

        <List sx={{ p: 0 }}>
          {cases.map((medicalCase) => (
            <ListItemButton
              key={medicalCase.id}
              onClick={() => onCaseSelect(medicalCase.id)}
              sx={{ borderRadius: 1.5, mb: 0.75, alignItems: "flex-start", px: 1.5, py: 1.25 }}
            >
              <ListItemText
                primary={medicalCase.patientName ?? medicalCase.patient}
                secondary={`${medicalCase.caseTitle ?? medicalCase.name} - ${medicalCase.submittedNoteCount}/${medicalCase.assignments.length} submitted`}
                primaryTypographyProps={{ fontSize: "1rem", fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: "0.95rem" }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

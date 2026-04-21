import {
  Box,
  CircularProgress,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyStudent, FacultyStudentCase } from "../../services/facultyApi";
import { getStudentCaseStatusTone } from "./facultyStudentPageUtils";

type FacultyStudentSidebarProps = {
  studentId?: string;
  studentSearch: string;
  assignedCaseSearch: string;
  filteredStudents: FacultyStudent[];
  filteredStudentCases: FacultyStudentCase[];
  studentCasesLoading: boolean;
  onStudentSearchChange: (value: string) => void;
  onAssignedCaseSearchChange: (value: string) => void;
  onStudentSelect: (studentId: string) => void;
  onAssignedCaseSelect: (caseId: number) => void;
};

export default function FacultyStudentSidebar({
  studentId,
  studentSearch,
  assignedCaseSearch,
  filteredStudents,
  filteredStudentCases,
  studentCasesLoading,
  onStudentSearchChange,
  onAssignedCaseSearchChange,
  onStudentSelect,
  onAssignedCaseSelect,
}: FacultyStudentSidebarProps) {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        "& .MuiDrawer-paper": {
          width: 320,
          top: { xs: "56px", sm: "64px" },
          height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
          overflowY: "auto",
          overscrollBehavior: "contain",
          bgcolor: "#ffffff",
          borderRight: "1px solid #dbe4f0",
        },
      }}
    >
      <Box sx={{ p: 2, pb: 6 }}>
        <Typography variant="overline" sx={{ color: "#1a3a5c", fontWeight: 700 }}>
          Students
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Search students"
          value={studentSearch}
          onChange={(event) => onStudentSearchChange(event.target.value)}
          sx={{ mb: 1.5 }}
        />

        <List dense sx={{ mb: 2 }}>
          {filteredStudents.map((student) => (
            <ListItemButton
              key={student.id}
              selected={student.id === studentId}
              onClick={() => onStudentSelect(student.id)}
              sx={{ borderRadius: 1.5, mb: 0.5, alignItems: "flex-start" }}
            >
              <ListItemText
                primary={getDisplayName(student)}
                secondary={`${student.assignmentCount} assigned / ${student.submittedCount} submitted`}
              />
            </ListItemButton>
          ))}
        </List>

        <Typography variant="overline" sx={{ color: "#1a3a5c", fontWeight: 700 }}>
          Assigned Cases
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Search assigned cases"
          value={assignedCaseSearch}
          onChange={(event) => onAssignedCaseSearchChange(event.target.value)}
          sx={{ mb: 1.5 }}
        />

        {studentCasesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredStudentCases.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No assigned cases found for this student.
          </Typography>
        ) : (
          <List dense>
            {filteredStudentCases.map((medicalCase) => {
              const status = getStudentCaseStatusTone(medicalCase.note);

              return (
                <ListItemButton
                  key={medicalCase.id}
                  onClick={() => onAssignedCaseSelect(medicalCase.id)}
                  sx={{ borderRadius: 1.5, mb: 0.5, alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={medicalCase.patientName ?? medicalCase.patient}
                    secondary={`${medicalCase.caseTitle ?? medicalCase.name} / ${status.label}`}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Drawer>
  );
}

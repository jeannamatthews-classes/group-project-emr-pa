import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { FacultyCase } from "../../services/facultyApi";

export type FacultyAvailableCaseItem =
  | {
      source: "course";
      key: string;
      id: number;
      patientName: string;
      caseTitle: string;
      caseType: string;
      hasLabs: boolean;
      submittedNoteCount: number;
      assignmentCount: number;
      case: FacultyCase;
    }
  | {
      source: "bank";
      key: string;
      templateId: string;
      patientName: string;
      caseTitle: string;
      caseType: string;
      hasLabs: boolean;
    };

type FacultyAvailableCasesCardProps = {
  availableCaseSearch: string;
  filteredAvailableCases: FacultyAvailableCaseItem[];
  assigningCaseKey: string | null;
  onAvailableCaseSearchChange: (value: string) => void;
  onAssignCase: (medicalCase: FacultyAvailableCaseItem) => void;
  onRequestDelete: (medicalCase: FacultyCase) => void;
};

export default function FacultyAvailableCasesCard({
  availableCaseSearch,
  filteredAvailableCases,
  assigningCaseKey,
  onAvailableCaseSearchChange,
  onAssignCase,
  onRequestDelete,
}: FacultyAvailableCasesCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Assign Existing Case
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Assign one of the existing cases to this student.
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Search available cases"
          value={availableCaseSearch}
          onChange={(event) => onAvailableCaseSearchChange(event.target.value)}
          sx={{ mb: 2 }}
        />

        {filteredAvailableCases.length === 0 ? (
          <Typography color="text.secondary">
            No additional faculty cases are available to assign.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {filteredAvailableCases.map((medicalCase) => (
              <Card key={medicalCase.key} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {medicalCase.patientName}
                      </Typography>
                      <Typography color="text.secondary">
                        {medicalCase.caseTitle}
                      </Typography>
                      {medicalCase.source === "course" && (
                        <Typography color="text.secondary">
                          {medicalCase.submittedNoteCount}/{medicalCase.assignmentCount} submitted
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                        <Chip label={medicalCase.caseType.toUpperCase()} size="small" />
                        {medicalCase.hasLabs && (
                          <Chip label="Labs" size="small" color="info" variant="outlined" />
                        )}
                        {medicalCase.source === "bank" && (
                          <Chip label="Case Bank" size="small" color="success" variant="outlined" />
                        )}
                      </Stack>
                    </Box>

                    <Stack
                      direction={{ xs: "row", md: "column" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", md: "flex-end" }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: "#1a3a5c",
                          borderRadius: 999,
                          px: 2,
                          textTransform: "none",
                          fontWeight: 700,
                          minWidth: 104,
                        }}
                        onClick={() => onAssignCase(medicalCase)}
                        disabled={assigningCaseKey === medicalCase.key}
                        startIcon={
                          assigningCaseKey === medicalCase.key ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : null
                        }
                      >
                        {assigningCaseKey === medicalCase.key ? "Assigning..." : "Assign"}
                      </Button>
                      {medicalCase.source === "course" && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteOutlineIcon />}
                          sx={{ borderRadius: 999, px: 1.75, textTransform: "none", fontWeight: 600 }}
                          onClick={() => onRequestDelete(medicalCase.case)}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

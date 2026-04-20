import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyStudentCase } from "../../services/facultyApi";
import { getStudentCaseStatusTone } from "./facultyStudentPageUtils";

type FacultyAssignedCasesCardProps = {
  studentCasesLoading: boolean;
  studentCases: FacultyStudentCase[];
  onReviewCase: (caseId: number) => void;
  onRequestUnassign: (medicalCase: FacultyStudentCase) => void;
  onRequestDelete: (medicalCase: FacultyStudentCase) => void;
};

export default function FacultyAssignedCasesCard({
  studentCasesLoading,
  studentCases,
  onReviewCase,
  onRequestUnassign,
  onRequestDelete,
}: FacultyAssignedCasesCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Assigned Cases
        </Typography>

        {studentCasesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : studentCases.length === 0 ? (
          <Typography color="text.secondary">
            This student does not have any assigned cases yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {studentCases.map((medicalCase) => {
              const status = getStudentCaseStatusTone(medicalCase.note);

              return (
                <Card key={medicalCase.id} variant="outlined" sx={{ borderRadius: 2 }}>
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
                        <Typography variant="h6" fontWeight={700}>
                          {medicalCase.patientName ?? medicalCase.patient}
                        </Typography>
                        <Typography color="text.secondary">
                          {medicalCase.caseTitle ?? medicalCase.name}
                        </Typography>
                        <Typography color="text.secondary">
                          Assigned {new Date(medicalCase.assignedAt).toLocaleDateString()}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                          <Chip label={medicalCase.caseType.toUpperCase()} size="small" />
                          {medicalCase.hasLabs && (
                            <Chip label="Labs" size="small" color="info" variant="outlined" />
                          )}
                          <Chip
                            label={`Assigned by ${getDisplayName(medicalCase.assignedByFaculty)}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip label={status.label} size="small" color={status.color} />
                          {medicalCase.note?.grade !== null && medicalCase.note?.grade !== undefined && (
                            <Chip
                              label={`Grade: ${medicalCase.note.grade}`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>

                      <Stack
                        direction={{ xs: "row", md: "column" }}
                        spacing={1}
                        alignItems={{ xs: "stretch", md: "flex-end" }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 999, px: 1.75, textTransform: "none", fontWeight: 600 }}
                          onClick={() => onReviewCase(medicalCase.id)}
                        >
                          Review
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<PersonRemoveOutlinedIcon />}
                          sx={{ borderRadius: 999, px: 1.75, textTransform: "none", fontWeight: 600 }}
                          onClick={() => onRequestUnassign(medicalCase)}
                        >
                          Unassign
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteOutlineIcon />}
                          sx={{ borderRadius: 999, px: 1.75, textTransform: "none", fontWeight: 600 }}
                          onClick={() => onRequestDelete(medicalCase)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

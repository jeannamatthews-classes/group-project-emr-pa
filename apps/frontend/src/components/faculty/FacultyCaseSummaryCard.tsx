import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyCaseDetail, FacultyCaseNote } from "../../services/facultyApi";

type AssignedStudent =
  | FacultyCaseDetail["assignments"][number]["student"]
  | FacultyCaseNote["student"];

type FacultyCaseSummaryCardProps = {
  caseDetail: FacultyCaseDetail;
  note: FacultyCaseNote | null;
  draftExists: boolean;
  assignedStudent: AssignedStudent | null;
  studentId?: string;
  patientName: string;
  chiefComplaint: string;
};

export default function FacultyCaseSummaryCard({
  caseDetail,
  note,
  draftExists,
  assignedStudent,
  studentId,
  patientName,
  chiefComplaint,
}: FacultyCaseSummaryCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
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
            <Typography variant="h4" fontWeight={700}>
              {patientName}
            </Typography>
            <Typography color="text.secondary">
              {chiefComplaint && chiefComplaint !== patientName
                ? chiefComplaint
                : "No chief complaint listed"}
            </Typography>
            <Typography color="text.secondary">
              Student: {assignedStudent ? getDisplayName(assignedStudent) : studentId}
            </Typography>
            <Typography color="text.secondary">
              Assigned student email: {assignedStudent?.email ?? "Not available"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={caseDetail.caseType.toUpperCase()} />
            {note ? (
              <Chip
                label={
                  note.isSubmitted
                    ? note.feedback !== null || note.grade !== null
                      ? "Reviewed"
                      : "Submitted"
                    : "Draft"
                }
                color={note.isSubmitted ? "info" : "warning"}
              />
            ) : draftExists ? (
              <Chip label="Draft started" color="warning" variant="outlined" />
            ) : (
              <Chip label="No note yet" variant="outlined" />
            )}
            {note?.grade !== null && note?.grade !== undefined && (
              <Chip label={`Grade: ${note.grade}`} color="success" />
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Date of Birth
            </Typography>
            <Typography>
              {caseDetail.dob ? new Date(caseDetail.dob).toLocaleDateString() : "Not available"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Gender
            </Typography>
            <Typography>{caseDetail.gender || "Not available"}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Code Status
            </Typography>
            <Typography>{caseDetail.codeStatus || "Not available"}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Location
            </Typography>
            <Typography>{caseDetail.location || "Unknown"}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

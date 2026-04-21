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
  const studentLabel = assignedStudent ? getDisplayName(assignedStudent) : "Unassigned";
  const chiefComplaintLabel =
    chiefComplaint && chiefComplaint !== patientName ? chiefComplaint : "No chief complaint listed";

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: "2.75rem", md: "3.35rem" },
                lineHeight: 1,
                fontWeight: 800,
                mb: 1.25,
              }}
            >
              {patientName}
            </Typography>
            <Typography sx={{ fontSize: { xs: "1.45rem", md: "1.65rem" }, mb: 0.25 }}>
              Chief Complaint: {chiefComplaintLabel}
            </Typography>
            <Typography sx={{ fontSize: { xs: "1.45rem", md: "1.65rem" }, mb: 0.25 }}>
              Student: {studentLabel || studentId}
            </Typography>
            <Typography sx={{ fontSize: { xs: "1.45rem", md: "1.65rem" } }}>
              Email: {assignedStudent?.email ?? "Not available"}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ alignSelf: { xs: "flex-start", md: "flex-start" } }}
          >
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

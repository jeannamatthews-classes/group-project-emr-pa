import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import type { FacultyCaseNote } from "../../services/facultyApi";
import { formatSubmissionDate } from "./facultySubmissionShared";

type FacultySubmissionTimelineCardProps = {
  note: FacultyCaseNote;
};

export default function FacultySubmissionTimelineCard({
  note,
}: FacultySubmissionTimelineCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Submission Timeline
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography>{formatSubmissionDate(note.createdAt)}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <Typography>{formatSubmissionDate(note.updatedAt)}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Submitted
            </Typography>
            <Typography>{formatSubmissionDate(note.submittedAt)}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

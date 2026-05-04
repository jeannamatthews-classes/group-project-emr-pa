import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyCaseNote } from "../../services/facultyApi";

type FacultyFeedbackCardProps = {
  note: FacultyCaseNote;
  grade: string;
  feedback: string;
  saveMessage: string | null;
  saveError: string | null;
  savingFeedback: boolean;
  onGradeChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
};

export default function FacultyFeedbackCard({
  note,
  grade,
  feedback,
  saveMessage,
  saveError,
  savingFeedback,
  onGradeChange,
  onFeedbackChange,
  onSave,
}: FacultyFeedbackCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Faculty Feedback
        </Typography>

        {note.feedback && !saveMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Existing faculty feedback
            {note.reviewedByFaculty ? ` from ${getDisplayName(note.reviewedByFaculty)}` : ""}:{" "}
            {note.feedback}
          </Alert>
        )}

        {saveMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {saveMessage}
          </Alert>
        )}

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="Grade"
            type="number"
            value={grade}
            onChange={(event) => onGradeChange(event.target.value)}
            inputProps={{ min: 0, max: 100, step: 1 }}
            disabled={!note.isSubmitted || savingFeedback}
          />
          <TextField
            label="Feedback"
            multiline
            minRows={5}
            value={feedback}
            onChange={(event) => onFeedbackChange(event.target.value)}
            disabled={!note.isSubmitted || savingFeedback}
          />
          <Box>
            <Button
              variant="contained"
              sx={{ bgcolor: "#1a3a5c" }}
              onClick={onSave}
              disabled={!note.isSubmitted || savingFeedback}
              startIcon={savingFeedback ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {savingFeedback ? "Saving..." : "Save Feedback"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

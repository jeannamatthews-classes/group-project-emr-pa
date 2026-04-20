import { Card, CardContent, Stack, Typography } from "@mui/material";

import type { FacultyCaseNote } from "../../services/facultyApi";
import { displaySubmissionSectionValue, NOTE_SECTIONS } from "./facultySubmissionShared";

type FacultyNoteSectionsProps = {
  note: FacultyCaseNote;
};

export default function FacultyNoteSections({ note }: FacultyNoteSectionsProps) {
  return (
    <Stack spacing={3}>
      {NOTE_SECTIONS.map((section) => (
        <Card key={section.key} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {section.label}
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {displaySubmissionSectionValue(note[section.key])}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

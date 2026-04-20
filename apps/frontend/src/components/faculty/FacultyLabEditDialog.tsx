import type { ChangeEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import type { FacultyCaseLab } from "../../services/facultyApi";
import { LAB_FILE_ACCEPT, type LabEditFormState } from "./facultySubmissionShared";

type FacultyLabEditDialogProps = {
  open: boolean;
  editingLab: FacultyCaseLab | null;
  editLabForm: LabEditFormState;
  editLabFile: File | null;
  savingLabEdit: boolean;
  onClose: () => void;
  onSave: () => void;
  onEditLabFormChange: (nextForm: LabEditFormState) => void;
  onEditLabFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function FacultyLabEditDialog({
  open,
  editingLab,
  editLabForm,
  editLabFile,
  savingLabEdit,
  onClose,
  onSave,
  onEditLabFormChange,
  onEditLabFileChange,
}: FacultyLabEditDialogProps) {
  return (
    <Dialog open={open} onClose={savingLabEdit ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Lab</DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <TextField
          label="Lab Title"
          fullWidth
          value={editLabForm.title}
          onChange={(event) => onEditLabFormChange({ ...editLabForm, title: event.target.value })}
        />
        <TextField
          label="Category"
          fullWidth
          value={editLabForm.category}
          onChange={(event) =>
            onEditLabFormChange({ ...editLabForm, category: event.target.value })
          }
        />
        <TextField
          label="Faculty Note"
          fullWidth
          multiline
          minRows={3}
          value={editLabForm.description}
          onChange={(event) =>
            onEditLabFormChange({ ...editLabForm, description: event.target.value })
          }
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Button component="label" variant="outlined">
            Replace File
            <input hidden type="file" accept={LAB_FILE_ACCEPT} onChange={onEditLabFileChange} />
          </Button>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            {editLabFile
              ? editLabFile.name
              : editingLab?.originalFilename ?? "Upload a replacement file if needed."}
          </Typography>
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={editLabForm.isVisibleToStudent}
              onChange={(event) =>
                onEditLabFormChange({
                  ...editLabForm,
                  isVisibleToStudent: event.target.checked,
                })
              }
            />
          }
          label="Visible to students now"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={savingLabEdit}>
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{ bgcolor: "#1a3a5c" }}
          onClick={onSave}
          disabled={savingLabEdit}
        >
          {savingLabEdit ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

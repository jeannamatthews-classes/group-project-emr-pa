import type { ChangeEvent } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import type { FacultyCaseFormState } from "./facultyDashboardTypes";

type FacultyCaseDialogProps = {
  open: boolean;
  editingCaseId: number | null;
  savingCase: boolean;
  deletingCase: boolean;
  caseForm: FacultyCaseFormState;
  picturePreview: string | null;
  saveAsTemplate?: boolean;
  caseAlreadySavedToBank?: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onPictureChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCaseFormChange: (nextForm: FacultyCaseFormState) => void;
  onSaveAsTemplateChange?: (checked: boolean) => void;
};

export default function FacultyCaseDialog({
  open,
  editingCaseId,
  savingCase,
  deletingCase,
  caseForm,
  picturePreview,
  saveAsTemplate = false,
  caseAlreadySavedToBank = false,
  onClose,
  onSave,
  onDelete,
  onPictureChange,
  onCaseFormChange,
  onSaveAsTemplateChange,
}: FacultyCaseDialogProps) {
  const isBusy = savingCase || deletingCase;

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, bgcolor: "#1a3a5c", color: "#fff" }}>
        {editingCaseId !== null ? "Edit Case" : "Create Case"}
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={picturePreview ?? undefined}
            sx={{ width: 72, height: 72, bgcolor: "#dbe4f0" }}
          />
          <Button variant="outlined" component="label" size="small">
            {editingCaseId !== null ? "Update Photo" : "Upload Photo"}
            <input type="file" accept="image/*" hidden onChange={onPictureChange} />
          </Button>
        </Box>

        <TextField
          label="Patient Name"
          required
          fullWidth
          value={caseForm.name}
          onChange={(event) => onCaseFormChange({ ...caseForm, name: event.target.value })}
        />

        <TextField
          label="Chief Complaint"
          fullWidth
          value={caseForm.chiefComplaint}
          onChange={(event) =>
            onCaseFormChange({ ...caseForm, chiefComplaint: event.target.value })
          }
        />

        <TextField
          label="Date of Birth"
          type="date"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={caseForm.dob}
          onChange={(event) => onCaseFormChange({ ...caseForm, dob: event.target.value })}
        />

        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            label="Gender"
            value={caseForm.gender}
            onChange={(event) => onCaseFormChange({ ...caseForm, gender: String(event.target.value) })}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Code Status</InputLabel>
          <Select
            label="Code Status"
            value={caseForm.codeStatus}
            onChange={(event) =>
              onCaseFormChange({ ...caseForm, codeStatus: String(event.target.value) })
            }
          >
            <MenuItem value="Full Code">Full Code</MenuItem>
            <MenuItem value="DNR">DNR</MenuItem>
            <MenuItem value="DNI">DNI</MenuItem>
            <MenuItem value="DNR-DNI">DNR-DNI</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Location"
          fullWidth
          value={caseForm.location}
          onChange={(event) => onCaseFormChange({ ...caseForm, location: event.target.value })}
        />

        <FormControl fullWidth>
          <InputLabel>Case Type</InputLabel>
          <Select
            label="Case Type"
            value={caseForm.caseType}
            onChange={(event) => onCaseFormChange({ ...caseForm, caseType: String(event.target.value) })}
          >
            <MenuItem value="pbl">PBL</MenuItem>
            <MenuItem value="sim">SIM</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={caseForm.hasLabs}
                onChange={(event) =>
                  onCaseFormChange({ ...caseForm, hasLabs: event.target.checked })
                }
              />
            }
            label="Case with Labs"
          />
          <Typography variant="body2" color="text.secondary">
            Faculty can upload labs later.
          </Typography>
        </Box>

        {editingCaseId === null ? (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={saveAsTemplate}
                  onChange={(event) => onSaveAsTemplateChange?.(event.target.checked)}
                />
              }
              label="Save this case to the case bank"
            />
            <Typography variant="body2" color="text.secondary">
              The case bank stores a copy of this case. This course will have its own copy for
              assignments and submissions.
            </Typography>
          </Box>
        ) : caseAlreadySavedToBank ? (
          <Typography variant="body2" color="text.secondary">
            This case is already in the case bank.
          </Typography>
        ) : (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={saveAsTemplate}
                  onChange={(event) => onSaveAsTemplateChange?.(event.target.checked)}
                />
              }
              label="Add this case to the case bank"
            />
            <Typography variant="body2" color="text.secondary">
              The case bank stores a copy of this case. This course will keep its own case for
              assignments and submissions.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {editingCaseId !== null && (
          <Button onClick={onClose} disabled={isBusy} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        )}
        {editingCaseId !== null && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={onDelete}
            disabled={isBusy}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {deletingCase ? "Deleting..." : "Delete Case"}
          </Button>
        )}
        {editingCaseId === null && (
          <Button onClick={onClose} disabled={isBusy} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isBusy}
          sx={{ bgcolor: "#1a3a5c", textTransform: "none", fontWeight: 700 }}
        >
          {savingCase
            ? editingCaseId !== null
              ? "Saving..."
              : "Creating..."
            : editingCaseId !== null
              ? "Save Changes"
              : "Create Case"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

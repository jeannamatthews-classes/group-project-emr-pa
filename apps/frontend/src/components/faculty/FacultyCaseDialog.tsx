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

import type { FacultyCaseFormState } from "./facultyDashboardTypes";

type FacultyCaseDialogProps = {
  open: boolean;
  editingCaseId: number | null;
  savingCase: boolean;
  caseForm: FacultyCaseFormState;
  picturePreview: string | null;
  onClose: () => void;
  onSave: () => void;
  onPictureChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCaseFormChange: (nextForm: FacultyCaseFormState) => void;
};

export default function FacultyCaseDialog({
  open,
  editingCaseId,
  savingCase,
  caseForm,
  picturePreview,
  onClose,
  onSave,
  onPictureChange,
  onCaseFormChange,
}: FacultyCaseDialogProps) {
  return (
    <Dialog open={open} onClose={savingCase ? undefined : onClose} maxWidth="sm" fullWidth>
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
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={savingCase} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={savingCase}
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

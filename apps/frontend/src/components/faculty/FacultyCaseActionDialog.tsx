import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

import type { CaseActionDialogState } from "./facultyStudentPageTypes";

type FacultyCaseActionDialogProps = {
  actionDialog: CaseActionDialogState | null;
  processingAction: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function FacultyCaseActionDialog({
  actionDialog,
  processingAction,
  onClose,
  onConfirm,
}: FacultyCaseActionDialogProps) {
  return (
    <Dialog
      open={actionDialog !== null}
      onClose={processingAction ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {actionDialog?.mode === "unassign" ? "Unassign Case" : "Delete Case"}
      </DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ mb: 1.5 }}>
          {actionDialog?.mode === "unassign"
            ? `Remove ${actionDialog.patientName} from this student's assigned cases?`
            : `Delete the case for ${actionDialog?.patientName}?`}
        </Typography>
        <Typography color="text.secondary">{actionDialog?.caseName || "Untitled case"}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {actionDialog?.mode === "unassign"
            ? "This also removes the student's note and feedback for this case so the assignment is fully cleared."
            : "This permanently deletes the case, assignments, notes, labs, and uploaded files for it."}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={processingAction} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={processingAction}
          color={actionDialog?.mode === "delete" ? "error" : "warning"}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {processingAction
            ? actionDialog?.mode === "delete"
              ? "Deleting..."
              : "Unassigning..."
            : actionDialog?.mode === "delete"
              ? "Delete Case"
              : "Unassign Case"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

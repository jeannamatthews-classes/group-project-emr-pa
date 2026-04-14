import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { adminChangeOwnPassword, getStoredToken } from "../../services/authApi";

export default function SettingsPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (submitting) {
      return;
    }
    setOpenDialog(false);
  };

  const validate = (): string | null => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return "All password fields are required";
    }
    if (newPassword.length < 8) {
      return "New password must be at least 8 characters";
    }
    if (newPassword !== confirmPassword) {
      return "New password and confirmation do not match";
    }
    if (newPassword === currentPassword) {
      return "New password must be different from current password";
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      setSubmitting(true);
      await adminChangeOwnPassword(token, {
        currentPassword,
        newPassword,
      });

      resetForm();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack alignItems="flex-start" sx={{ width: "100%" }}>
      <Button
        variant="contained"
        size="large"
        onClick={handleOpenDialog}
        sx={{ px: 4, py: 1.1, borderRadius: 2 }}
      >
        Change Password
      </Button>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              size="small"
              autoComplete="current-password"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              size="small"
              autoComplete="new-password"
              helperText="Use at least 8 characters"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="small"
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

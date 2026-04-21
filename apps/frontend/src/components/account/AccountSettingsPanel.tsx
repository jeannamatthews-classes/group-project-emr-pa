import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  changeMyPassword,
  getDisplayName,
  getMe,
  getStoredToken,
  updateMyProfile,
} from "../../services/authApi";

export default function AccountSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = getStoredToken();
      if (!token) {
        if (active) {
          setLoading(false);
          setProfileError("You are not logged in.");
        }
        return;
      }

      try {
        const { user } = await getMe(token);
        if (!active) return;
        setUsername(user.username);
        setEmail(user.email);
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
      } catch (error) {
        if (!active) return;
        setProfileError(error instanceof Error ? error.message : "Failed to load account settings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveProfile() {
    const token = getStoredToken();
    if (!token) {
      setProfileError("You are not logged in.");
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setProfileError("First name and last name are required.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileMessage(null);
      const { user } = await updateMyProfile(token, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setProfileMessage(`Profile updated for ${getDisplayName(user)}.`);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    const token = getStoredToken();
    if (!token) {
      setPasswordError("You are not logged in.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordMessage(null);
      const result = await changeMyPassword(token, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(result.message);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Profile
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Update your name here.
          </Typography>

          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}

          {profileMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {profileMessage}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField label="Username" value={username} disabled fullWidth />
            <TextField label="Email" value={email} disabled fullWidth />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={loading || profileSaving}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={loading || profileSaving}
                fullWidth
              />
            </Stack>
            <BoxAction
              loading={profileSaving}
              disabled={loading}
              label="Save Profile"
              onClick={() => void handleSaveProfile()}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Password
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Change your password here. Use at least 8 characters.
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          {passwordMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordMessage}
            </Alert>
          )}

          <Stack spacing={2} component="form" autoComplete="off">
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={passwordSaving}
              autoComplete="off"
              name="account-current-password"
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={passwordSaving}
              autoComplete="off"
              name="account-new-password"
              fullWidth
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={passwordSaving}
              autoComplete="off"
              name="account-confirm-password"
              fullWidth
            />
            <BoxAction
              loading={passwordSaving}
              label="Update Password"
              onClick={() => void handleChangePassword()}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function BoxAction({
  loading,
  disabled,
  label,
  onClick,
}: {
  loading: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="contained"
      sx={{ alignSelf: "flex-start", bgcolor: "#1a3a5c", textTransform: "none", fontWeight: 700 }}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? "Saving..." : label}
    </Button>
  );
}

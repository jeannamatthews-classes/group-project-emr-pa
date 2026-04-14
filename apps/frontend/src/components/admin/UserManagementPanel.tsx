import {
  Alert,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  adminDeleteUser,
  adminListUsers,
  getMe,
  adminUpdateUserRole,
  adminResetUserPassword,
  getStoredToken,
  type AdminRole,
  type AdminUserListItem,
} from "../../services/authApi";

const roleColor: Record<AdminUserListItem["role"], "default" | "primary" | "info" | "secondary"> = {
  student: "info",
  faculty: "secondary",
  admin: "primary",
  unassigned: "default",
};

export default function UserManagementPanel() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserListItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const [data, me] = await Promise.all([adminListUsers(token), getMe(token)]);
      setUsers(data.users);
      setCurrentUserId(me.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return users;
    }
    return users.filter((u) =>
      [u.username, u.email, u.role].some((v) => v.toLowerCase().includes(q))
    );
  }, [users, filter]);

  const counts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] += 1;
        return acc;
      },
      { student: 0, faculty: 0, admin: 0, unassigned: 0 }
    );
  }, [users]);

  const displayIds = useMemo(() => {
    const sorted = [...users].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return new Map(sorted.map((user, index) => [user.id, index + 1]));
  }, [users]);

  const handleDelete = async (id: string) => {
    const previousUsers = users;
    try {
      setError(null);
      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      setUsers((prev) => prev.filter((user) => user.id !== id));
      await adminDeleteUser(token, id);
    } catch (err) {
      setUsers(previousUsers);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      setResetLoading(true);
      setError(null);
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      const result = await adminResetUserPassword(token, resetTarget.id, resetPassword);
      setSuccessMsg(result.message);
      setResetTarget(null);
      setResetPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleRoleChange = async (id: string, role: AdminRole) => {
    const previousUsers = users;
    try {
      setError(null);
      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      setUpdatingRoleId(id);
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, role } : user))
      );

      const result = await adminUpdateUserRole(token, id, role);
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? result.user : user))
      );
    } catch (err) {
      setUsers(previousUsers);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by name, email, or role..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ bgcolor: "#ffffff" }}
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" py={3}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      <Paper sx={{ p: 1.5, border: "1px solid #dbe4f0" }}>
        <Table size="small" sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {displayIds.get(user.id)}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role.toUpperCase()}
                    color={roleColor[user.role]}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                    <Select
                      size="small"
                      value={user.role}
                      disabled={updatingRoleId === user.id || currentUserId === user.id}
                      onChange={(e) => void handleRoleChange(user.id, e.target.value as AdminRole)}
                      sx={{
                        width: 132,
                        height: 30,
                        ".MuiSelect-select": {
                          py: 0.25,
                          px: 0.875,
                          fontSize: 12,
                          lineHeight: 1.2,
                        },
                      }}
                    >
                      <MenuItem value="unassigned">UNASSIGNED</MenuItem>
                      <MenuItem value="student">STUDENT</MenuItem>
                      <MenuItem value="faculty">FACULTY</MenuItem>
                      <MenuItem value="admin">ADMIN</MenuItem>
                    </Select>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      disabled={updatingRoleId === user.id || currentUserId === user.id}
                      sx={{ minWidth: 72, height: 30, px: 0.875, fontSize: 12, lineHeight: 1.2 }}
                      onClick={() => { setResetTarget(user); setResetPassword(""); }}
                    >
                      Reset Pw
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={updatingRoleId === user.id || currentUserId === user.id}
                      sx={{ minWidth: 58, height: 30, px: 0.875, fontSize: 12, lineHeight: 1.2 }}
                      onClick={() => void handleDelete(user.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Paper sx={{ p: 2, flex: 1, border: "1px solid #dbe4f0" }}>
          <Typography variant="overline" color="text.secondary">
            Total Active Users
          </Typography>
          <Typography variant="h4" color="#114fb3" fontWeight={700}>
            {users.length}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, border: "1px solid #dbe4f0" }}>
          <Typography variant="body2">Students: {counts.student}</Typography>
          <Typography variant="body2">Faculty: {counts.faculty}</Typography>
          <Typography variant="body2">Administrators: {counts.admin}</Typography>
          <Typography variant="body2">Unassigned: {counts.unassigned}</Typography>
        </Paper>
      </Stack>

      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Set a new password for <strong>{resetTarget?.username}</strong>.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            type="password"
            label="New Password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleResetPassword(); }}
            helperText="Minimum 8 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} disabled={resetLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={resetLoading || resetPassword.length < 8}
            onClick={() => void handleResetPassword()}
          >
            {resetLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Stack>
  );
}

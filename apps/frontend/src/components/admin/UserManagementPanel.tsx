import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { userRows } from "./mockData";
import type { UserRow } from "./types";

const roleColor: Record<UserRow["role"], "default" | "primary" | "info" | "secondary"> = {
  STUDENT: "info",
  FACULTY: "secondary",
  ADMIN: "primary",
  UNASSIGNED: "default",
};

export default function UserManagementPanel() {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by name, email, or role..."
          sx={{ bgcolor: "#ffffff" }}
        />
        <Button variant="contained" sx={{ minWidth: 180 }}>
          Add New User
        </Button>
      </Stack>

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
            {userRows.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {user.id}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={roleColor[user.role]}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.joinedDate}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button size="small" variant="contained">
                      Change Role
                    </Button>
                    <Button size="small" variant="outlined" color="error">
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Paper sx={{ p: 2, flex: 1, border: "1px solid #dbe4f0" }}>
          <Typography variant="overline" color="text.secondary">
            Total Active Users
          </Typography>
          <Typography variant="h4" color="#114fb3" fontWeight={700}>
            5
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, border: "1px solid #dbe4f0" }}>
          <Typography variant="body2">Students: 1</Typography>
          <Typography variant="body2">Faculty: 2</Typography>
          <Typography variant="body2">Administrators: 1</Typography>
          <Typography variant="body2">Unassigned: 1</Typography>
        </Paper>
      </Stack>
    </Stack>
  );
}

import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { adminGetLogs, getStoredToken, type AdminLogItem } from "../../services/authApi";

const eventColor: Record<string, "default" | "success" | "error"> = {
  USER_REGISTERED: "success",
  USER_DELETED: "error",
};

export default function SystemLogsPanel() {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getStoredToken();
        if (!token) {
          throw new Error("Not authenticated");
        }
        const data = await adminGetLogs(token);
        setLogs(data.logs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    void loadLogs();
  }, []);

  return (
    <Stack spacing={2}>
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
              <TableCell>Event</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Target User</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Chip
                    label={log.eventType}
                    color={eventColor[log.eventType] ?? "default"}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {log.targetUserId ?? "-"}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No logs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

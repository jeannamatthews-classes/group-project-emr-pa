import { Paper, Typography } from "@mui/material";

export default function SystemLogsPanel() {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid #dbe4f0" }}>
      <Typography variant="body1">
        Shows logs for logins, role changes and other important things.
      </Typography>
    </Paper>
  );
}

import { Paper, Typography } from "@mui/material";

export default function SettingsPanel() {
  return (
    <Paper sx={{ p: 2.5, border: "1px solid #dbe4f0" }}>
      <Typography variant="body1">Some useful setting for administrators.</Typography>
    </Paper>
  );
}

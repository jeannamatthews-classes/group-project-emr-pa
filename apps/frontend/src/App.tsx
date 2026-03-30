import { useState } from "react";

import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

const panelStyle = {
  bgcolor: "#ffffff",
  borderRadius: 3,
  p: 2.5,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  height: "70vh",
  display: "flex",
  flexDirection: "column"
};

export default function FacultyDashboard() {
  return (
    <Box
      sx={{
        bgcolor: "#f4f7fb",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 4, pt: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Faculty Dashboard
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          flex: 1,
          px: 4,
          pb: 4,
          width: "100%",
        }}
      >
        <Box sx={panelStyle}>
        {
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Students
          </Typography>
        }
        </Box>
        <Box sx={panelStyle}>{/* Cases */}</Box>
      </Box>
    </Box>
  );
}
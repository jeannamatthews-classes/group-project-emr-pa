import { Box, Stack, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { adminNavItems } from "./mockData";

export default function AdminSidebar() {
  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 84, sm: 220 },
        bgcolor: "#ffffff",
        borderRight: "1px solid #dbe4f0",
        px: 1.5,
        py: 3,
      }}
    >
      <Typography
        component={NavLink}
        to="/portal"
        sx={{
          fontWeight: 800,
          color: "#2165d1",
          mb: 4,
          textAlign: { xs: "center", sm: "left" },
          fontSize: { xs: "0.9rem", sm: "1.1rem" },
          textDecoration: "none",
          display: "block",
        }}
      >
        EMR-PA
      </Typography>

      <Stack spacing={1}>
        {adminNavItems.map((item) => (
          <Box
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={{
              textDecoration: "none",
              color: "#1e3a5f",
              fontWeight: 600,
              borderRadius: 1.5,
              px: 1.5,
              py: 1,
              "&.active": {
                bgcolor: "#e7f0ff",
                color: "#114fb3",
              },
            }}
          >
            {item.label}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

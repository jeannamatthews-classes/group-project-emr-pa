import { Box, Button, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import AccountSettingsPanel from "../components/account/AccountSettingsPanel";
import { logout } from "../services/authApi";

export default function AccountSettingsPage() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          bgcolor: "#1a3a5c",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(14, 33, 56, 0.18)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <SettingsIcon />
          <Typography variant="h6" fontWeight={700}>
            Account Settings
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" sx={{ textTransform: "none", fontWeight: 600 }} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 900, mx: "auto", px: 3, py: 4 }}>
        <AccountSettingsPanel />
      </Box>
    </Box>
  );
}

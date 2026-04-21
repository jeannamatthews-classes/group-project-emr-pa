import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";

type FacultyDashboardTopBarProps = {
  isAdmin: boolean;
  onGoHome: () => void;
  onGoToAdmin: () => void;
  onGoToSettings: () => void;
  onLogout: () => void;
};

export default function FacultyDashboardTopBar({
  isAdmin,
  onGoHome,
  onGoToAdmin,
  onGoToSettings,
  onLogout,
}: FacultyDashboardTopBarProps) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}>
      <Toolbar>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={onGoHome}
        >
          EMR Faculty Portal
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAdmin && (
            <Button
              color="inherit"
              onClick={onGoToAdmin}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Go to Admin Page
            </Button>
          )}

          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            onClick={onGoToSettings}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Settings
          </Button>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

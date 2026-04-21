import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";

type FacultyPageTopBarProps = {
  title: string;
  isAdmin: boolean;
  secondaryActionLabel?: string;
  onTitleClick: () => void;
  onGoAdmin: () => void;
  onSecondaryAction?: () => void;
  onGoSettings: () => void;
  onLogout: () => void;
};

export default function FacultyPageTopBar({
  title,
  isAdmin,
  secondaryActionLabel,
  onTitleClick,
  onGoAdmin,
  onSecondaryAction,
  onGoSettings,
  onLogout,
}: FacultyPageTopBarProps) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}>
      <Toolbar>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={onTitleClick}
        >
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAdmin && (
            <Button
              color="inherit"
              onClick={onGoAdmin}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Go to Admin Page
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              color="inherit"
              onClick={onSecondaryAction}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {secondaryActionLabel}
            </Button>
          )}

          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            onClick={onGoSettings}
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

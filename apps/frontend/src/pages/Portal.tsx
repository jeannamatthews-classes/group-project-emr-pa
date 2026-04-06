import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import UserNameBadge from "../components/UserNameBadge";
import { getMe, getStoredToken } from "../services/authApi";

const portalButtonSx = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 600,
  px: 2,
};

export default function PortalPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const token = getStoredToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const me = await getMe(token);

        if (me.user.role === "admin") {
          setReady(true);
          return;
        }

        if (me.user.role === "faculty") {
          navigate("/faculty", { replace: true });
          return;
        }

        if (me.user.role === "student") {
          navigate("/student", { replace: true });
          return;
        }

        navigate("/unassigned", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    };

    void checkRole();
  }, [navigate]);

  if (!ready) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        bgcolor: "#eef2f7",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 520, borderRadius: 3 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Login successful.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <UserNameBadge />
                <LogoutButton variant="outlined" size="small" />
              </Box>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/admin/users"
                variant="contained"
                size="small"
                sx={portalButtonSx}
                fullWidth
              >
                Go to Admin Page
              </Button>
              <Button
                component={RouterLink}
                to="/faculty"
                variant="contained"
                size="small"
                sx={portalButtonSx}
                fullWidth
              >
                Go to Faculty Page
              </Button>
            </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  to="/student"
                  variant="outlined"
                  size="small"
                  sx={portalButtonSx}
                  fullWidth
                >
                  Go to Student View
                </Button>
              </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

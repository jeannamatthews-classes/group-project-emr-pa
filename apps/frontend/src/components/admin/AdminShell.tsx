import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Button } from "@mui/material";
import AdminSidebar from "./AdminSidebar";
import LogoutButton from "../LogoutButton";
import UserNameBadge from "../UserNameBadge";
import { getMe, getStoredToken } from "../../services/authApi";

type AdminShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export default function AdminShell({
  title,
  subtitle,
  children,
}: AdminShellProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      const token = getStoredToken();
      if (!token) return;

      try {
        const me = await getMe(token);
        if (!active) return;
        setIsAdmin(me.user.role === "admin");
      } catch {
        if (!active) return;
        setIsAdmin(false);
      }
    }

    void loadRole();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#eef2f7" }}>
      <AdminSidebar />
      <Box sx={{ flex: 1 }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e0e7f0" }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              color="#1b2a41"
              fontWeight={700}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/admin/users")}
            >
              EMR-PA System Administration
            </Typography>
            <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
              {isAdmin && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/faculty")}
                  sx={{ textTransform: "none" }}
                >
                  Go to Faculty Page
                </Button>
              )}
              <UserNameBadge />
              <LogoutButton variant="outlined" size="small" />
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" color="#0f172a" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body1" color="#334155" sx={{ mt: 0.5, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

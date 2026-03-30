import type { PropsWithChildren } from "react";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import AdminSidebar from "./AdminSidebar";

type AdminShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export default function AdminShell({
  title,
  subtitle,
  children,
}: AdminShellProps) {
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
            <Typography variant="h6" color="#1b2a41" fontWeight={700}>
              EMR-PA System Administration
            </Typography>
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

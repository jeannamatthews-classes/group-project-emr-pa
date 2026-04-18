import { Box, Card, CardContent, Typography } from "@mui/material";
import LogoutButton from "../components/LogoutButton";
import UserNameBadge from "../components/UserNameBadge";

export default function UnassignedPage() {
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
      <Card sx={{ width: "100%", maxWidth: 560, borderRadius: 3 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 2 }}>
            <UserNameBadge />
            <LogoutButton variant="outlined" size="small" />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Role Not Assigned Yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You are yet to be assigned a role. Please contact an administrator.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

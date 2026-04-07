import { Box, Container } from "@mui/material";
import RegisterForm from "../components/Login components/RegisterForm";
import LogoutButton from "../components/LogoutButton";

export default function RegisterPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm" disableGutters>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <LogoutButton variant="text" size="small" />
        </Box>
        <RegisterForm />
      </Container>
    </Box>
  );
}
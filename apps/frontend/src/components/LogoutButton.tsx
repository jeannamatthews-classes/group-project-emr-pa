import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authApi";

type LogoutButtonProps = {
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
};

export default function LogoutButton({
  variant = "outlined",
  size = "small",
}: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Button variant={variant} size={size} color="error" onClick={handleLogout}>
      Logout
    </Button>
  );
}
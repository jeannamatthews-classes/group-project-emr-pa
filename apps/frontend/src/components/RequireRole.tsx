import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getStoredToken, isGuestModeEnabled } from "../services/authApi";

interface RequireRoleProps {
  allowed: string[];
  children: React.ReactNode;
}

export default function RequireRole({ allowed, children }: RequireRoleProps) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const canUseGuestRoute =
    isGuestModeEnabled() && (allowed.includes("faculty") || allowed.includes("student"));

  useEffect(() => {
    const check = async () => {
      const token = getStoredToken();
      if (!token) {
        if (canUseGuestRoute) {
          setOk(true);
          return;
        }
        navigate("/login", { replace: true });
        return;
      }
      try {
        const me = await getMe(token);
        if (allowed.includes(me.user.role)) {
          setOk(true);
        } else {
          navigate("/portal", { replace: true });
        }
      } catch {
        if (canUseGuestRoute) {
          setOk(true);
          return;
        }
        navigate("/login", { replace: true });
      }
    };
    void check();
  }, [navigate, allowed, canUseGuestRoute]);

  if (!ok) return null;
  return <>{children}</>;
}

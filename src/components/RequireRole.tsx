import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getStoredToken } from "../services/authApi";

interface RequireRoleProps {
  allowed: string[];
  children: React.ReactNode;
}

export default function RequireRole({ allowed, children }: RequireRoleProps) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = getStoredToken();
      if (!token) {
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
        navigate("/login", { replace: true });
      }
    };
    void check();
  }, [navigate, allowed]);

  if (!ok) return null;
  return <>{children}</>;
}

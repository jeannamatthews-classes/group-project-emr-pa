import { Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { getDisplayName, getMe, getStoredToken } from "../services/authApi";

export default function UserNameBadge() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      if (!token) {
        setDisplayName(null);
        return;
      }

      try {
        const me = await getMe(token);
        setDisplayName(getDisplayName(me.user));
      } catch {
        setDisplayName(null);
      }
    };

    void load();
  }, []);

  if (!displayName) {
    return null;
  }

  return <Chip size="small" label={displayName} variant="outlined" />;
}

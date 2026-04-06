import { Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { getMe, getStoredToken } from "../services/authApi";

export default function UserNameBadge() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      if (!token) {
        setUsername(null);
        return;
      }

      try {
        const me = await getMe(token);
        setUsername(me.user.username);
      } catch {
        setUsername(null);
      }
    };

    void load();
  }, []);

  if (!username) {
    return null;
  }

  return <Chip size="small" label={`username: ${username}`} variant="outlined" />;
}

import { useEffect, useState, type ComponentProps } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Container, Link, Stack, TextField, Typography } from "@mui/material";

import { resendEmailCode, setStoredToken, verifyEmailCode } from "../services/authApi";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const fromLogin = searchParams.get("from") === "login";
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(
    fromLogin ? "Your account is waiting for email verification. Enter your code or request a new one." : null
  );
  const [error, setError] = useState<string | null>(null);

  async function submitVerification(nextEmail = email, nextCode = code) {
    const normalizedEmail = nextEmail.trim().toLowerCase();
    const normalizedCode = nextCode.trim();

    if (!normalizedEmail || !normalizedCode) {
      setError("Email and verification code are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const result = await verifyEmailCode({ email: normalizedEmail, code: normalizedCode });
      if (result.token) {
        setStoredToken(result.token);
      }
      setMessage("Your email is verified. Taking you to the portal...");
      window.setTimeout(() => navigate("/portal", { replace: true }), 800);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Failed to verify email.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const emailFromUrl = searchParams.get("email") ?? "";
    const codeFromUrl = searchParams.get("code") ?? "";
    if (emailFromUrl && codeFromUrl) {
      void submitVerification(emailFromUrl, codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    await submitVerification();
  };

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email before requesting a new code.");
      return;
    }

    try {
      setResending(true);
      setError(null);
      const result = await resendEmailCode({ email: normalizedEmail });
      setMessage(result.message);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2, bgcolor: "background.default" }}>
      <Container maxWidth="sm" disableGutters>
        <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 3, mx: "auto" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                Verify Email
              </Typography>

              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    fullWidth
                  />
                  <TextField
                    label="Verification Code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    disabled={loading}
                    fullWidth
                  />

                  {message ? <Alert severity="success">{message}</Alert> : null}
                  {error ? <Alert severity="error">{error}</Alert> : null}

                  <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: "none", fontWeight: 700 }}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                  <Button type="button" variant="outlined" disabled={resending || loading} onClick={() => void handleResend()} sx={{ textTransform: "none" }}>
                    {resending ? "Sending..." : "Resend Email"}
                  </Button>
                </Stack>
              </Box>

              <Typography variant="body2" textAlign="center">
                Already verified?{" "}
                <Link component={RouterLink} to="/login">
                  Sign In
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

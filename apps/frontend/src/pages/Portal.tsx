import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function PortalPage() {
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
      <Card sx={{ width: "100%", maxWidth: 520, borderRadius: 3 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Login successful.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/admin/users"
                variant="contained"
                fullWidth
              >
                Go to Admin Page
              </Button>
              <Button
                component={RouterLink}
                to="/student"
                variant="outlined"
                fullWidth
              >
                Go to Student Page
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

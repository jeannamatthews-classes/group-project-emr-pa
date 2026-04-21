import { Card, CardContent, Stack, Typography } from "@mui/material";

type FacultyDashboardStatsProps = {
  studentCount: number;
  caseCount: number;
  submittedCount: number;
  pendingCount: number;
};

const STAT_ITEMS = [
  { label: "Students", key: "studentCount" },
  { label: "Number of Cases", key: "caseCount" },
  { label: "Submitted Notes", key: "submittedCount" },
  { label: "Pending Submission", key: "pendingCount" },
] as const;

export default function FacultyDashboardStats({
  studentCount,
  caseCount,
  submittedCount,
  pendingCount,
}: FacultyDashboardStatsProps) {
  const statValues = {
    studentCount,
    caseCount,
    submittedCount,
    pendingCount,
  };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
      {STAT_ITEMS.map((item) => (
        <Card key={item.key} sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {statValues[item.key]}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

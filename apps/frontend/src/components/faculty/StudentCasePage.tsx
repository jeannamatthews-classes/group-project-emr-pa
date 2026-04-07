import { useParams, useNavigate } from "react-router-dom";
import { mockStudents, mockCases, mockAssignedCases } from "../Imports";
import { Box, Button, Typography } from "@mui/material";

export default function StudentCasePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  if(!caseId) return null;

  const caseDetail = mockCases.find((c) => c.id === parseInt(caseId));
  if (!caseDetail) return null;

  const assignedStudent = mockAssignedCases.find((ac) => ac.caseId === parseInt(caseId));
  const student = mockStudents.find((s) => s.id === assignedStudent?.studentId);

  return (
    <Box sx={{ p: 4 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        {caseDetail?.title}
      </Typography>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Patient: {caseDetail?.patient}
      </Typography>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Assigned to: {student?.name}
      </Typography>
    </Box>
  );
}
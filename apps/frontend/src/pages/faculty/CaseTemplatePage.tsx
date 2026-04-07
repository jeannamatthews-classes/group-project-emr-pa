import { useParams, useNavigate } from "react-router-dom";
import type { Student, Case, AssignedCase } from "../components/Imports";
import { mockStudents, mockCases, mockAssignedCases, panelStyle } from "../components/Imports";
import { Box, Button, List, ListItemButton, ListItemText, Typography, TextField } from "@mui/material";

export default function CaseTemplatePage() {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();

    if(!caseId) return null;
 
    return (
      <Box p={4}>
        <Button onClick={() => navigate("/")}>
          Back
        </Button>

        <Typography variant="h5" sx={{ mt: 2}}>
          Case Template (ID: {caseId})
        </Typography>
      </Box>
    );
}
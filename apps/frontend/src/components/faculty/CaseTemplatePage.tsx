import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

export default function CaseTemplatePage() {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();

    if(!caseId) return null;
 
    return (
      <Box p={4}>
        <Button onClick={() => navigate(-1)}>
          Back
        </Button>

        <Typography variant="h5" sx={{ mt: 2}}>
          Case Template (ID: {caseId})
        </Typography>
      </Box>
    );
}
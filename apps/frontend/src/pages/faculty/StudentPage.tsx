import { useParams, useNavigate } from "react-router-dom";
import type { Student, Case, AssignedCase } from "../components/Imports";
import { mockStudents, mockCases, mockAssignedCases, panelStyle } from "../components/Imports";
import { Box, Button, List, ListItemButton, ListItemText, Typography, TextField } from "@mui/material";

export default function StudentPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    if(!studentId) return null;

    const student = mockStudents.find((s) => s.id === parseInt(studentId));
    if(!student) return null; 

    const assigned = mockAssignedCases.filter(ac => ac.studentId === student?.id);
    const casesForStudent = assigned 
        .map(ac => mockCases.find(c => c.id === ac.caseId))
        .filter((c): c is Case => Boolean(c));

    return (
        <Box 
            sx={{ 
                bgcolor: "#f4f7fb",
                height: "100vh",
                display: "flex",
                flexDirection: "column"
            }}
            >
            <Box sx={{ px: 4, pt: 4 }}>
                <Button onClick={() => navigate(-1)} sx={{ mb: 2}}>
                    Back
                </Button>

                <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
                    {student.name}
                </Typography>
            </Box>

            <Box 
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                    flex: 1,
                    px: 4,
                    pb: 4,
                    width: "100%",
                }}
            >
                <Box sx={panelStyle}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Assigned Cases
                    </Typography>

                    <List>
                        {casesForStudent.map(c => (
                            <ListItemButton
                            key={c.id}
                            onClick={() => navigate(`/studentCase/${c.id}`)}
                            sx={{ borderRadius: 2, mb: 1 }}
                            >
                            <ListItemText
                                primary={c.title}
                                secondary={c.patient}/>
                            </ListItemButton>
                        ))
                        }
                    </List>
                </Box>

                <Box sx={panelStyle}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Students
                    </Typography>

                    <List>
                        {mockStudents.map(s => (
                        <ListItemButton
                            key={s.id}
                            selected={s.id === student.id}
                            onClick={() => navigate(`/student/${s.id}`)}
                        >
                            <ListItemText primary={s.name}/>
                        </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Box>
        </Box>
    );   
}
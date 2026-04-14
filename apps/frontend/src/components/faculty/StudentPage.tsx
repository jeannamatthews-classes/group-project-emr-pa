import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Case } from "../Imports";
import { mockStudents, mockCases, mockAssignedCases, panelStyle } from "../Imports";
import { Box, Button, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { getStoredToken } from "../../services/authApi";
import { facultyAssignCase, facultyListStudents, type FacultyStudent } from "../../services/facultyApi";

export default function StudentPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [students, setStudents] = useState<FacultyStudent[]>([]);
    const [assigningCaseId, setAssigningCaseId] = useState<number | null>(null);
    const [assignMessage, setAssignMessage] = useState<string | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadStudents() {
            try {
                const token = getStoredToken();
                if (!token) return;
                const { students: nextStudents } = await facultyListStudents(token);
                if (!active) return;
                setStudents(nextStudents);
            } catch (error) {
                if (!active) return;
                console.error("Failed to load faculty students", error);
            }
        }

        void loadStudents();
        return () => {
            active = false;
        };
    }, []);

    if(!studentId) return null;

    const dbStudents = students.map((s) => ({ id: s.id, name: s.username }));
    const displayStudents = dbStudents.length > 0 ? dbStudents : mockStudents;

    const student = displayStudents.find((s) => String(s.id) === studentId);
    if(!student) return null; 

    const numericId = Number(student.id);
    const mappedMockStudentId = Number.isInteger(numericId)
        ? ((numericId - 1 + mockStudents.length) % mockStudents.length) + 1
        : (Array.from(String(student.id)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % mockStudents.length) + 1;

    const assigned = mockAssignedCases.filter(ac => ac.studentId === mappedMockStudentId);
    const casesForStudent = assigned 
        .map(ac => mockCases.find(c => c.id === ac.caseId))
        .filter((c): c is Case => Boolean(c));

    const selectedDbStudent = students.find((s) => s.id === String(student.id));

    async function handleAssignCase(caseId: number) {
        if (!selectedDbStudent) {
            setAssignError("Please select a DB student to assign this case.");
            setAssignMessage(null);
            return;
        }

        const token = getStoredToken();
        if (!token) {
            setAssignError("You are not logged in.");
            setAssignMessage(null);
            return;
        }

        try {
            setAssigningCaseId(caseId);
            setAssignError(null);
            setAssignMessage(null);
            await facultyAssignCase(token, {
                patientId: caseId,
                studentId: selectedDbStudent.id,
            });
            setAssignMessage(`Assigned case ${caseId} to ${selectedDbStudent.username}.`);
        } catch (error) {
            setAssignError(error instanceof Error ? error.message : "Failed to assign case");
        } finally {
            setAssigningCaseId(null);
        }
    }

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
                <Button onClick={() => navigate("/faculty")} sx={{ mb: 2}}>
                    Back
                </Button>
                <Button onClick={() => navigate("/portal")} sx={{ mb: 2, ml: 1 }}>
                    Back to Portal
                </Button>

                <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
                    {student.name}
                </Typography>
                {assignMessage ? <Typography color="success.main">{assignMessage}</Typography> : null}
                {assignError ? <Typography color="error">{assignError}</Typography> : null}
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
                        Available Cases
                    </Typography>

                    <List>
                        {casesForStudent.map(c => (
                            <ListItemButton
                            key={c.id}
                            onClick={() => navigate(`/studentCase/${student.id}/${c.id}`)}
                            sx={{ borderRadius: 2, mb: 1 }}
                            >
                            <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                <ListItemText
                                    primary={c.title}
                                    secondary={c.patient}
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void handleAssignCase(c.id);
                                    }}
                                    disabled={assigningCaseId === c.id}
                                >
                                    {assigningCaseId === c.id ? "Assigning..." : "Assign"}
                                </Button>
                            </Box>
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
                        {displayStudents.map(s => (
                        <ListItemButton
                            key={s.id}
                            selected={String(s.id) === String(student.id)}
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
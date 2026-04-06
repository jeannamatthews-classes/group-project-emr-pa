import { useState } from "react";

import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

type Case = {
    id: number;
    name: string;
    patient: string;
};

const mockCases: Case[] = [
    { id: 1, name: "Chest Pain Case", patient: "John Doe" },
    { id: 2, name: "Diabetes Follow-up", patient: "Jane Smith" },
];

export default function Student() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(mockCases[0]);
  const [search, setSearch] = useState("");
  const [hpi, setHpi] = useState("");
  const [exam, setExam] = useState("");
  const [assess, setAssess] = useState("");
  const [treat, setTreat] = useState("");

  const filteredCases = mockCases.filter((currentCase) =>
    currentCase.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    const payload = {
      caseId: selectedCase?.id,
      hpi,
      exam,
      assess,
      treat,
    };

    console.log("Saving Notes:", payload);
  };

  const handleSubmit = () => {
    console.log("Submitting assignment...");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <Drawer
        variant="permanent"
        anchor="left"
        PaperProps={{
          sx: {
            width: 280,
            boxSizing: "border-box",
            borderRight: "1px solid #dbe4f0",
            bgcolor: "#ffffff",
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Student Cases
          </Typography>

          <TextField
            fullWidth
            label="Search Cases"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
          />

          <List sx={{ mt: 2 }}>
            {filteredCases.map((currentCase) => (
              <ListItemButton
                key={currentCase.id}
                selected={selectedCase?.id === currentCase.id}
                onClick={() => setSelectedCase(currentCase)}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemText
                  primary={currentCase.name}
                  secondary={currentCase.patient}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, ml: "280px", p: 4 }}>
        {!selectedCase ? (
          <Typography>Select a case to begin.</Typography>
        ) : (
          <Box sx={{ maxWidth: 900 }}>
            <Typography variant="h4" fontWeight={700}>
              {selectedCase.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              Patient: {selectedCase.patient}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <TextField
                label="HPI"
                multiline
                rows={6}
                fullWidth
                value={hpi}
                onChange={(event) => setHpi(event.target.value)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Physical Exam"
                multiline
                rows={6}
                fullWidth
                value={exam}
                onChange={(event) => setExam(event.target.value)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Assessment"
                multiline
                rows={6}
                fullWidth
                value={assess}
                onChange={(event) => setAssess(event.target.value)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Treatment Plan"
                multiline
                rows={6}
                fullWidth
                value={treat}
                onChange={(event) => setTreat(event.target.value)}
              />
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={handleSave}>
                Save Notes
              </Button>

              <Button variant="outlined" onClick={handleSubmit}>
                Submit Assignment
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

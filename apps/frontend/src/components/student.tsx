import React, { useState } from "react"

import {
    Drawer,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    Box,
    Typography
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
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [search, setSearch] = useState("");
    const [hpi, setHpi] = useState("");
    const [exam, setExam] = useState("");
  
    const filteredCases = mockCases.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  
    const handleSave = () => {
      const payload = {
        caseId: selectedCase?.id,
        hpi,
        exam,
      };
  
      console.log("Saving Notes:", payload);
      // TODO: send to backend API
    };
  
    const handleSubmit = () => {
      console.log("Submitting assignment...");
      // TODO: API call
    };
  
    return (
      <Box display="flex">
        {/* Sidebar */}
        <Drawer variant="permanent" anchor="left">
          <Box p={2} width={250}>
            <TextField
              fullWidth
              label="Search Cases"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
  
            <List>
              {filteredCases.map((c) => (
                <ListItem button key={c.id} onClick={() => setSelectedCase(c)}>
                  <ListItemText primary={c.name} secondary={c.patient} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
  
        {/* Main Content */}
        <Box flex={1} p={3}>
          {!selectedCase ? (
            <Typography>Select a case to begin</Typography>
          ) : (
            <>
              <Typography variant="h5">{selectedCase.name}</Typography>
              <Typography variant="subtitle1">
                Patient: {selectedCase.patient}
              </Typography>
  
              <Box mt={3}>
                <TextField
                  label="HPI"
                  multiline
                  rows={4}
                  fullWidth
                  value={hpi}
                  onChange={(e) => setHpi(e.target.value)}
                />
              </Box>
  
              <Box mt={2}>
                <TextField
                  label="Physical Exam"
                  multiline
                  rows={4}
                  fullWidth
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                />
              </Box>
  
              <Box mt={3} display="flex" gap={2}>
                <Button variant="contained" onClick={handleSave}>
                  Save Notes
                </Button>
  
                <Button variant="outlined" onClick={handleSubmit}>
                  Submit Assignment
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    );
  }

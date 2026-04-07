import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import LogoutButton from "./LogoutButton";
import UserNameBadge from "./UserNameBadge";
import {
  getStoredToken,
  studentCreateCase,
  studentGetMyNoteForCase,
  studentListCases,
  studentSaveNote,
  type StudentCaseItem,
} from "../services/authApi";

export default function Student() {
  const [cases, setCases] = useState<StudentCaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [hpi, setHpi] = useState("");
  const [exam, setExam] = useState("");
  const [assess, setAssess] = useState("");
  const [treat, setTreat] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultCases: Array<{
    name: string;
    patient: string;
    location: string;
    dob: string;
    gender: string;
    codeStatus: string;
  }> = [
    {
      name: "Chest Pain Case",
      patient: "John Doe",
      location: "ED Room 2",
      dob: "1984-03-15",
      gender: "Male",
      codeStatus: "Full Code",
    },
    {
      name: "Diabetes Follow-up",
      patient: "Jane Smith",
      location: "Clinic A",
      dob: "1972-11-09",
      gender: "Female",
      codeStatus: "Full Code",
    },
  ];

  const fallbackCases: StudentCaseItem[] = [
    { id: 1, name: "Chest Pain Case", patient: "John Doe" },
    { id: 2, name: "Diabetes Follow-up", patient: "Jane Smith" },
  ];

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId]
  );

  const filteredCases = cases.filter((currentCase) =>
    currentCase.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoadingCases(true);
        setError(null);

        const token = getStoredToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const data = await studentListCases(token);
        const filteredApiCases = data.cases.filter(
          (item) => !/copd\s+exacerbation/i.test(item.name)
        );

        let resolvedCases = filteredApiCases;
        if (resolvedCases.length === 0) {
          const created = await Promise.all(defaultCases.map((item) => studentCreateCase(token, item)));
          resolvedCases = created.map((item) => item.case);
        }

        if (resolvedCases.length === 0) {
          resolvedCases = fallbackCases;
        }

        setCases(resolvedCases);
        setSelectedCaseId((prev) => prev ?? resolvedCases[0]?.id ?? null);
      } catch (err) {
        setCases(fallbackCases);
        setSelectedCaseId((prev) => prev ?? fallbackCases[0]?.id ?? null);
        setError(err instanceof Error ? err.message : "Failed to load cases from server. Showing default cases.");
      } finally {
        setLoadingCases(false);
      }
    };

    void loadCases();
  }, []);

  useEffect(() => {
    const loadNote = async () => {
      if (!selectedCaseId) {
        setHpi("");
        setExam("");
        return;
      }

      try {
        setLoadingNote(true);
        setError(null);

        const token = getStoredToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const data = await studentGetMyNoteForCase(token, selectedCaseId);
        setHpi(data.note.hpi ?? "");
        setExam(data.note.physicalExam ?? "");
        setAssess(data.note.assessment ?? data.note.assess ?? "");
        setTreat(data.note.treatmentPlan ?? data.note.treat ?? "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load note";
        if (/No note found/i.test(message)) {
          setHpi("");
          setExam("");
          setAssess("");
          setTreat("");
          return;
        }
        setError(message);
      } finally {
        setLoadingNote(false);
      }
    };

    void loadNote();
  }, [selectedCaseId]);

  const handleSave = async (): Promise<boolean> => {
    if (!selectedCase) {
      setError("Select a case to save notes");
      return false;
    }

    try {
      setSaving(true);
      setError(null);

      const token = getStoredToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      await studentSaveNote(token, {
        caseId: selectedCase.id,
        hpi,
        exam,
        assessment: assess,
        treatmentPlan: treat,
      });

      setSuccessMsg("Notes saved successfully");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const saved = await handleSave();
    if (saved) {
      setSuccessMsg("Assignment submitted");
    }
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
                onClick={() => setSelectedCaseId(currentCase.id)}
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
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 2 }}>
          <UserNameBadge />
          <LogoutButton variant="outlined" size="small" />
        </Box>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {loadingCases ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

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
                disabled={loadingNote}
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
                disabled={loadingNote}
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
                disabled={loadingNote}
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
                disabled={loadingNote}
                onChange={(event) => setTreat(event.target.value)}
              />
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={() => void handleSave()} disabled={saving || loadingNote}>
                {saving ? "Saving..." : "Save Notes"}
              </Button>

              <Button variant="outlined" onClick={() => void handleSubmit()} disabled={saving || loadingNote}>
                Submit Assignment
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3500}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

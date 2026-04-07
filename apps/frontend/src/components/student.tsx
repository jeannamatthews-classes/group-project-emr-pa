import { useState } from "react";
import Collapse from "@mui/material/Collapse";

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
  const [treat, setTreat] = useState("");
  const [assess, setAssess] = useState("");
  const [med, setMed] = useState("");
  const [aller, setAllerg] = useState("");
  const [fhist, setFHist] = useState("");
  const [shist, setSHist] = useState("");
  const [proc, setProc] = useState("");
  const [diag, setDiag] = useState("");
  const [lad, setLAD] = useState("");
  const [cab, setCAB] = useState("");
  const [learn, setLearn] = useState("");

  const filteredCases = mockCases.filter((currentCase) =>
    currentCase.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    const payload = {
      caseId: selectedCase?.id,
      hpi,
      exam,
      treat,
      assess,
      med,
      aller,
      fhist,
      shist,
      proc,
      diag,
      lad,
      cab,
      learn
    };

    console.log("Saving Notes:", payload);
  };

  const [openSections, setOpenSections] = useState({
    hpi: true,
    med: false,
    exam: false,
    aller: false,
    assess: false,
    fhist: false,
    shist: false,
    proc: false,
    diag: false,
    lad: false,
    treat: false,
    cab: false,
    learn: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
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
            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("hpi")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>HPI</Typography>
                <Typography>
                  {openSections.hpi ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.hpi}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={hpi}
                    onChange={(e) => setHpi(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            //////////
            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("med")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Medications</Typography>
                <Typography>
                  {openSections.med ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.med}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={med}
                    onChange={(e) => setMed(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>
            /////////
            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("exam")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Physical Exam</Typography>
                <Typography>
                  {openSections.exam ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.exam}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("aller")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Allergies</Typography>
                <Typography>
                  {openSections.aller ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.aller}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={aller}
                    onChange={(e) => setAllerg(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("assess")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Assessment</Typography>
                <Typography>
                  {openSections.assess ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.assess}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={assess}
                    onChange={(e) => setAssess(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("fhist")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Family History</Typography>
                <Typography>
                  {openSections.fhist ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.fhist}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={fhist}
                    onChange={(e) => setFHist(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("shist")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Social History</Typography>
                <Typography>
                  {openSections.hpi ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.shist}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={shist}
                    onChange={(e) => setSHist(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("proc")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Procedures</Typography>
                <Typography>
                  {openSections.proc ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.proc}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={proc}
                    onChange={(e) => setProc(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("diag")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Diagnosis</Typography>
                <Typography>
                  {openSections.diag ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.diag}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={diag}
                    onChange={(e) => setDiag(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("lad")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Lab and Diagnostics</Typography>
                <Typography>
                  {openSections.lad ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.lad}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={lad}
                    onChange={(e) => setLAD(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("treat")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Treatment Plan</Typography>
                <Typography>
                  {openSections.treat ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.treat}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={treat}
                    onChange={(e) => setTreat(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("cab")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Coding and Billing</Typography>
                <Typography>
                  {openSections.cab ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.cab}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={cab}
                    onChange={(e) => setCAB(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>

            <> <Box
              sx={{
                mt: 3,
                border: "1px solid #dbe4f0",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* CLICKABLE HEADER */}
              <Box
                onClick={() => toggleSection("learn")}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f7f9fc",
                }}
              >
                <Typography fontWeight={600}>Learning Issues</Typography>
                <Typography>
                  {openSections.learn ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* ANIMATED CONTENT */}
              <Collapse in={openSections.learn}>
                <Box sx={{ p: 2 }}>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={learn}
                    onChange={(e) => setLearn(e.target.value)}
                  />
                </Box>
              </Collapse>
            </Box> </>


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
    </Box >
  );
}

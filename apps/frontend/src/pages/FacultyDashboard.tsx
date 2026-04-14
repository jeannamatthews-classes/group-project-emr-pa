import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

import { mockStudents, mockCases } from "../components/Imports";

export default function FacultyDashboard() {
  const navigate = useNavigate();

  const [studentSearch, setStudentSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const filteredStudents = mockStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCases = mockCases.filter((c) =>
    c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a3a5c" }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            EMR Faculty Portal
          </Typography>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => navigate("/login")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Exit
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          "& .MuiDrawer-paper": {
            width: 300,
            mt: "64px",
            bgcolor: "#ffffff",
            borderRight: "1px solid #dbe4f0",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="overline"
            sx={{ color: "#1a3a5c", fontWeight: 700 }}
          >
            Students
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Search students"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            sx={{ mb: 1.5 }}
          />

          <List dense>
            {filteredStudents.map((student) => (
              <ListItemButton
                key={student.id}
                onClick={() => navigate(`/student/${student.id}`)}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemText primary={student.name} />
              </ListItemButton>
            ))}
          </List>

          {/* ── Cases Section ── */}
          <Typography
            variant="overline"
            sx={{ color: "#1a3a5c", fontWeight: 700, mt: 2, display: "block" }}
          >
            Cases
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Search cases"
            value={caseSearch}
            onChange={(e) => setCaseSearch(e.target.value)}
            sx={{ mb: 1.5 }}
          />

          <List dense>
            {filteredCases.map((c) => (
              <ListItemButton
                key={c.id}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemText
                  primary={c.title}
                  secondary={c.patient}
                />
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation(); // prevents row click conflict
                    navigate(`/caseTemplate/${c.id}`);
                  }}
                >
                  Edit
                </Button>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, ml: "300px", mt: "64px", p: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Faculty Dashboard
        </Typography>

        <Typography color="text.secondary">
          Select a student or case from the sidebar to begin.
        </Typography>
      </Box>
    </Box>
  );
}

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { mockStudents, mockCases, panelStyle } from "../components/Imports";
// import { Box, Button, List, ListItemButton, ListItemText, Typography, TextField } from "@mui/material";
// import { getStoredToken } from "../services/authApi";
// import { facultyListStudents, type FacultyStudent } from "../services/facultyApi";

// export default function FacultyDashboard() {
//   const [studentSearch, setStudentSearch] = useState("");
//   const [caseSearch, setCaseSearch] = useState("");
//   const [students, setStudents] = useState<FacultyStudent[]>([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     let active = true;

//     async function loadStudents() {
//       try {
//         const token = getStoredToken();
//         if (!token) return;
//         const { students: nextStudents } = await facultyListStudents(token);
//         if (!active) return;
//         setStudents(nextStudents);
//       } catch (error) {
//         if (!active) return;
//         console.error("Failed to load faculty students", error);
//       }
//     }

//     void loadStudents();
//     return () => {
//       active = false;
//     };
//   }, []);

//   const filteredStudents = (students.length > 0
//     ? students.map((s) => ({ id: s.id, name: s.username }))
//     : mockStudents
//   ).filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
//   const filteredCases = mockCases.filter((c) =>c.title.toLowerCase().includes(caseSearch.toLowerCase()));

//   return (
//     <Box
//       sx={{
//         bgcolor: "#f4f7fb",
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <Box sx={{ px: 4, pt: 4 }}>
//         <Button onClick={() => navigate("/portal")} sx={{ mb: 2 }}>
//           Back to Portal
//         </Button>
//         <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
//           Faculty Dashboard
//         </Typography>
//       </Box>

//       <Box
//         sx={{
//           display: "grid",
//           gridTemplateColumns: "1fr 1fr",
//           gap: 3,
//           flex: 1,
//           px: 4,
//           pb: 4,
//           width: "100%",
//         }}
//       >
//         <Box sx={panelStyle}>
//           <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
//             Students
//           </Typography>

//           <TextField
//             fullWidth
//             label="Search Students"
//             value={studentSearch}
//             onChange={(e) => setStudentSearch(e.target.value)}
//             size="small"
//           />

//           <List sx={{ mt: 2, overflowY: "auto", flex: 1 }}>
//             {filteredStudents.map((student) => (
//               <ListItemButton 
//                 key={student.id}
//                 onClick={() => navigate(`/student/${student.id}`) }
//                 sx={{ borderRadius: 2, mb: 1 }}
//                 >
//                 <ListItemText primary={student.name}/>
//               </ListItemButton>
//             ))}
//           </List>
//         </Box>

//         <Box sx={panelStyle}>
//           <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
//             Cases
//           </Typography>

//           <TextField
//             fullWidth
//             label="Search Cases"
//             value={caseSearch}
//             onChange={(e) => setCaseSearch(e.target.value)}
//             size="small"
//           />

//           <List sx={{ mt: 2, overflowY: "auto", flex: 1 }}>
//             {filteredCases.map((c) => (
//               <ListItemButton 
//                 key={c.id}
//                 sx={{ borderRadius: 2, mb: 1 }}
//               >
//                 <Box
//                   sx={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     width: "100%"
//                   }}
//                 >
//                   <Box>
//                     <Typography variant="body1">{c.title}</Typography>
//                     <Typography variant="body2" color="text.secondary">{c.patient}</Typography>
//                   </Box>

//                   <Button
//                     variant="outlined"
//                     size="small"
//                     onClick={() => navigate(`/caseTemplate/${c.id}`)}
//                   >
//                     Edit
//                   </Button>
//                 </Box>
//               </ListItemButton>
//             ))}
//           </List>
//         </Box>

//       </Box>
//     </Box>
//   );
// }

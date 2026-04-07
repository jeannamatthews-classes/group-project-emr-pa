import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import SystemLogsPage from "./pages/admin/SystemLogsPage";
import FacultyCaseTemplatePage from "./components/faculty/CaseTemplatePage";
import FacultyStudentCasePage from "./components/faculty/StudentCasePage";
import FacultyStudentPage from "./components/faculty/StudentPage";
import FacultyPage from "./pages/FacultyDashboard.tsx";
import LoginPage from "./pages/Login";
import PortalPage from "./pages/Portal";
import RegisterPage from "./pages/Register";
import StudentPage from "./pages/student";
import UnassignedPage from "./pages/Unassigned";
import RequireRole from "./components/RequireRole";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/unassigned" element={<UnassignedPage />} />
        <Route path="/faculty" element={<RequireRole allowed={["faculty", "admin"]}><FacultyPage /></RequireRole>} />
        <Route path="/student/:studentId" element={<RequireRole allowed={["faculty", "admin"]}><FacultyStudentPage /></RequireRole>} />
        <Route path="/studentCase/:caseId" element={<RequireRole allowed={["faculty", "admin"]}><FacultyStudentCasePage /></RequireRole>} />
        <Route path="/caseTemplate/:caseId" element={<RequireRole allowed={["faculty", "admin"]}><FacultyCaseTemplatePage /></RequireRole>} />
        <Route path="/student" element={<RequireRole allowed={["student", "admin"]}><StudentPage /></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole allowed={["admin"]}><AdminUsersPage /></RequireRole>} />
        <Route path="/admin/logs" element={<RequireRole allowed={["admin"]}><SystemLogsPage /></RequireRole>} />
        <Route path="/admin/settings" element={<RequireRole allowed={["admin"]}><SettingsPage /></RequireRole>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
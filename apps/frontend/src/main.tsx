import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import SystemLogsPage from "./pages/admin/SystemLogsPage";
import LoginPage from "./pages/Login";
import PortalPage from "./pages/Portal";
import RegisterPage from "./pages/Register";
import StudentPage from "./pages/student";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/logs" element={<SystemLogsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
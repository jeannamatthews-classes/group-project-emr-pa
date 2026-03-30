import AdminShell from "../../components/admin/AdminShell";
import SettingsPanel from "../../components/admin/SettingsPanel";

export default function SettingsPage() {
  return (
    <AdminShell title="Settings" subtitle="">
      <SettingsPanel />
    </AdminShell>
  );
}

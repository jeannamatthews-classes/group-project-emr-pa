import AdminShell from "../../components/admin/AdminShell";
import AccountSettingsPanel from "../../components/account/AccountSettingsPanel";

export default function SettingsPage() {
  return (
    <AdminShell title="Settings" subtitle="">
      <AccountSettingsPanel />
    </AdminShell>
  );
}

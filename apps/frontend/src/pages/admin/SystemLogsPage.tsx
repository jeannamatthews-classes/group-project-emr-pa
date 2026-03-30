import AdminShell from "../../components/admin/AdminShell";
import SystemLogsPanel from "../../components/admin/SystemLogsPanel";

export default function SystemLogsPage() {
  return (
    <AdminShell title="System Logs" subtitle="">
      <SystemLogsPanel />
    </AdminShell>
  );
}

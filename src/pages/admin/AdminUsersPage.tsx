import AdminShell from "../../components/admin/AdminShell";
import UserManagementPanel from "../../components/admin/UserManagementPanel";

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="User Management"
      subtitle="View and manage user accounts, roles, and permissions for the EMR system."
    >
      <UserManagementPanel />
    </AdminShell>
  );
}

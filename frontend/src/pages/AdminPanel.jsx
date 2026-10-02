// frontend/src/pages/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Users, Activity, Trash2, Shield, Target } from "lucide-react";
import toast from "react-hot-toast";
import { apiJson } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { confirmDialog } from "../store/confirmStore";
import Page from "../components/UI/Page";
import { SkeletonCard, SkeletonStatGrid } from "../components/UI/Skeleton";

const AdminPanel = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Admin data comes from the backend: RLS only lets users read their own profile row.
  const fetchAll = useCallback(async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        apiJson("/api/admin/users"),
        apiJson("/api/admin/stats"),
      ]);
      setUsers(usersData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error(error.message || "Failed to load users");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteUser = async (target) => {
    const ok = await confirmDialog({
      title: "Delete user?",
      message: `${target.name || target.email} and all of their data will be permanently deleted.`,
      confirmText: "Delete user",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(target.id);
    try {
      // Server-side: needs the service_role key and re-checks admin rights
      await apiJson(`/api/admin/users/${target.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setStats((s) => ({ ...s, users: Math.max(0, (s.users || 1) - 1) }));
      toast.success("User deleted");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const updateUserRole = async (target, newRole) => {
    if (newRole === "admin") {
      const ok = await confirmDialog({
        title: "Make this user an admin?",
        message: `${target.name || target.email} will be able to view and delete every user's data.`,
        confirmText: "Make admin",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await apiJson(`/api/admin/users/${target.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u)));
      toast.success("Role updated. It applies the next time they sign in.");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    }
  };

  const statCards = [
    { label: "Total users", value: stats.users, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total activities", value: stats.activities, icon: Activity, color: "text-green-600 dark:text-green-400" },
    { label: "Total goals", value: stats.goals, icon: Target, color: "text-purple-600 dark:text-purple-400" },
  ];

  if (initialLoading) {
    return (
      <Page title="Admin" icon={Shield}>
        <SkeletonStatGrid count={3} />
        <SkeletonCard lines={6} className="mt-6" />
      </Page>
    );
  }

  return (
    <Page title="Admin" icon={Shield} subtitle="Manage users and view platform stats">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <Icon className={`w-8 h-8 ${color}`} aria-hidden="true" />
            <div>
              <p className="text-sm text-muted">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(value ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="card !p-0 overflow-hidden">
        <h2 className="card-title px-5 py-4 border-b border-gray-200 dark:border-gray-700">Users</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((u) => {
            const isSelf = u.id === user?.id;
            return (
              <li key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {u.name || "Unnamed"} {isSelf && <span className="text-muted font-normal">(you)</span>}
                  </p>
                  <p className="text-sm text-muted truncate">{u.email}</p>
                  <p className="text-xs text-muted mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`role-${u.id}`} className="sr-only">
                    Role for {u.email}
                  </label>
                  <select
                    id={`role-${u.id}`}
                    value={u.role}
                    disabled={isSelf}
                    onChange={(e) => updateUserRole(u, e.target.value)}
                    className="input-field !w-auto"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => deleteUser(u)}
                    disabled={isSelf || deletingId === u.id}
                    className="icon-btn text-red-600 dark:text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
                    aria-label={`Delete ${u.email}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
};

export default AdminPanel;

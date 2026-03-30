import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useUserStore } from "../../store/userStore";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  plan: string;
  created_at: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const currentUser = useUserStore((s) => s.user);

  const fetchUsers = useCallback(() => {
    api.get("/auth/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch { /* ignore */ }
  };

  const updatePlan = async (userId: string, plan: string) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/plan`, { plan });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan } : u)));
    } catch { /* ignore */ }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Permanently delete this user and all their data?")) return;
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch { /* ignore */ }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q)
    );
  });

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-black mb-1">User Management</h1>
          <p className="text-sm text-slate">{users.length} registered users</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border-gray bg-white focus:outline-none focus:ring-2 focus:ring-cta-blue/30 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cloud-gray/50 text-left text-slate">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                {isSuperAdmin && <th className="px-4 py-3 font-medium w-12" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isSuperAdmin ? 6 : 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-cloud-gray rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 6 : 5} className="text-center py-12 text-slate">No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-cloud-gray/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-black">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-slate">{u.email}</td>
                    <td className="px-4 py-3">
                      {isSuperAdmin && u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="text-xs rounded border border-border-gray px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-cta-blue/30"
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.plan}
                        onChange={(e) => updatePlan(u.id, e.target.value)}
                        className="text-xs rounded border border-border-gray px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-cta-blue/30"
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="team">team</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate">{new Date(u.created_at).toLocaleDateString()}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700",
    admin: "bg-orange-100 text-orange-700",
    editor: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[role] ?? colors.viewer}`}>
      {role}
    </span>
  );
}

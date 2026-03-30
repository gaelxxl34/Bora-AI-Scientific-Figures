import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import { AdminOverview } from "./AdminOverview";
import { AdminUsers } from "./AdminUsers";
import { AdminLogs } from "./AdminLogs";

export function AdminLayout() {
  const { user, signOut } = useUserStore();

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Navigate to="/app" replace />;
  }

  const navItems = [
    { to: "/app/admin", label: "Overview", icon: "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" },
    { to: "/app/admin/users", label: "Users", icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" },
    { to: "/app/admin/logs", label: "AI Logs", icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" },
  ];

  return (
    <div className="min-h-screen bg-lab-white">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-border-gray">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <NavLink to="/app">
              <img src="/img/Bora AI.png" alt="Bora" style={{ width: 120 }} />
            </NavLink>
            <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/app"
              className="text-xs text-slate hover:text-ink-black font-medium"
            >
              Back to App
            </NavLink>
            <button
              onClick={signOut}
              className="text-xs text-slate hover:text-red-500 font-medium"
            >
              Sign Out
            </button>
            <div className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {user.fullName?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border-gray bg-white min-h-[calc(100vh-56px)] p-4">
          <p className="text-[10px] font-semibold text-slate/50 uppercase tracking-wider mb-3">
            Administration
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-red-600 bg-red-50"
                      : "text-slate hover:text-ink-black hover:bg-lab-white"
                  }`
                }
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-4 border-t border-border-gray">
            <p className="text-[10px] text-slate/50 mb-1">Signed in as</p>
            <p className="text-xs font-medium text-ink-black truncate">{user.email}</p>
            <p className="text-[10px] text-red-500 font-semibold uppercase">{user.role.replace("_", " ")}</p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 max-w-6xl">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="logs" element={<AdminLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

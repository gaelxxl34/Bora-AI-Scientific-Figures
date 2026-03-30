import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { figureStorage, type SavedFigure } from "../../services/figureStorage";
import { templates } from "../../data/templates";
import { useUserStore } from "../../store/userStore";

const TEMPLATE_GRADIENTS = [
  "from-blue-50 to-cyan-50",
  "from-violet-50 to-purple-50",
  "from-rose-50 to-pink-50",
  "from-amber-50 to-yellow-50",
  "from-emerald-50 to-teal-50",
  "from-sky-50 to-indigo-50",
];

const TEMPLATE_ICON_COLORS = [
  "text-blue-400",
  "text-violet-400",
  "text-rose-400",
  "text-amber-400",
  "text-emerald-400",
  "text-sky-400",
];

export function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("last-opened");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [figures, setFigures] = useState<SavedFigure[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((s) => s.user);
  const signOut = useUserStore((s) => s.signOut);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    setFigures(figureStorage.list());
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    figureStorage.delete(id);
    setFigures(figureStorage.list());
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const created = figureStorage.create(template.title);
    navigate(`/app/editor/${created.id}?template=${templateId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  // Sort figures
  const sorted = [...figures].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "created") return new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filtered = sorted.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2.5 group">
              <img
                src="/img/small%20logo.png"
                alt="Bora"
                className="w-10 h-10 object-contain"
              />
              <span className="text-[15px] font-semibold text-ink-black tracking-tight">
                Bora
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/app/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Admin
              </Link>
            )}
            <button
              onClick={() => navigate("/app/editor/new")}
              className="flex items-center gap-1.5 bg-bora-blue text-white text-[13px] font-medium px-3.5 py-[7px] rounded-lg hover:bg-bora-blue/90 transition-colors shadow-sm shadow-bora-blue/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Figure
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-bora-blue to-blue-600 text-white text-[11px] font-bold flex items-center justify-center hover:shadow-md transition-shadow cursor-pointer"
              >
                {userInitials}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-black/8 border border-gray-200/80 py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-gray-100">
                    <p className="text-[13px] font-medium text-ink-black truncate">{user?.fullName || "User"}</p>
                    <p className="text-[11px] text-slate truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-[1120px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-ink-black mb-1">
            Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-slate">
            Create publication-quality scientific figures with AI
          </p>
        </div>

        {/* Quick Start Templates */}
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold text-slate uppercase tracking-wide mb-4">
            Start with a template
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {templates.map((t, i) => (
              <button
                key={t.id}
                onClick={() => handleUseTemplate(t.id)}
                className="rounded-xl border border-gray-200/80 bg-white hover:border-bora-blue/30 hover:shadow-md hover:shadow-bora-blue/5 transition-all overflow-hidden group text-left"
              >
                <div className={`h-20 bg-gradient-to-br ${TEMPLATE_GRADIENTS[i % TEMPLATE_GRADIENTS.length]} flex items-center justify-center`}>
                  <svg className={`w-7 h-7 ${TEMPLATE_ICON_COLORS[i % TEMPLATE_ICON_COLORS.length]} opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-[11px] font-medium text-ink-black truncate leading-tight">{t.title}</p>
                  <p className="text-[10px] text-slate/70 mt-0.5">{t.field}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* My Figures */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-ink-black">
              My Figures
              {figures.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate">
                  {figures.length} file{figures.length !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search figures..."
                  className="w-52 pl-8 pr-3 py-[6px] rounded-lg border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-bora-blue/20 focus:border-bora-blue/40 placeholder:text-slate/40 transition-colors"
                />
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-[6px] text-[13px] text-slate cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="last-opened">Last opened</option>
                <option value="name">Name</option>
                <option value="created">Created</option>
              </select>
              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView("grid")}
                  className={`p-[6px] transition-colors ${view === "grid" ? "bg-bora-blue text-white" : "text-slate/50 hover:text-slate hover:bg-gray-50"}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-[6px] transition-colors ${view === "list" ? "bg-bora-blue text-white" : "text-slate/50 hover:text-slate hover:bg-gray-50"}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* File grid / list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 py-20 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-bora-blue-light to-blue-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-bora-blue/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink-black mb-1">
                {search ? "No matching figures" : "No figures yet"}
              </p>
              <p className="text-xs text-slate/60 mb-5 max-w-xs mx-auto">
                {search
                  ? "Try a different search term"
                  : "Create your first AI-powered scientific figure or start with a template above"
                }
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/app/editor/new")}
                  className="inline-flex items-center gap-2 bg-bora-blue text-white text-[13px] font-medium px-5 py-2.5 rounded-lg hover:bg-bora-blue/90 transition-colors shadow-sm shadow-bora-blue/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create your first figure
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((f) => (
                <Link
                  key={f.id}
                  to={`/app/editor/${f.id}`}
                  className="rounded-xl border border-gray-200/80 bg-white hover:border-bora-blue/30 hover:shadow-lg hover:shadow-black/5 transition-all overflow-hidden group"
                >
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
                    {f.thumbnail ? (
                      <img src={f.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-8 h-8 text-slate/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                    )}
                    {/* Hover overlay with delete */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />
                    <button
                      onClick={(e) => handleDelete(f.id, e)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm text-slate/60 hover:text-red-500 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[13px] font-medium text-ink-black truncate">{f.title}</p>
                    <p className="text-[11px] text-slate/60 mt-0.5">Edited {formatDate(f.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden divide-y divide-gray-100">
              {filtered.map((f) => (
                <Link
                  key={f.id}
                  to={`/app/editor/${f.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 flex items-center justify-center shrink-0 overflow-hidden">
                    {f.thumbnail ? (
                      <img src={f.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-4 h-4 text-slate/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink-black truncate">{f.title}</p>
                  </div>
                  <p className="text-[11px] text-slate/50 shrink-0">{formatDate(f.updatedAt)}</p>
                  <button
                    onClick={(e) => handleDelete(f.id, e)}
                    className="w-7 h-7 rounded-lg text-slate/40 hover:text-red-500 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

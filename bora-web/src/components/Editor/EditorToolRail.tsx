type SidePanel = "search" | "text" | "shapes" | "templates" | "ai" | null;

interface Props {
  activePanel: SidePanel;
  onToggle: (panel: SidePanel) => void;
}

const tools = [
  {
    id: "search" as const,
    label: "Search",
    icon: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
  },
  {
    id: "text" as const,
    label: "Text",
    icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z",
  },
  {
    id: "shapes" as const,
    label: "Shapes",
    icon: "M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42",
  },
  {
    id: "templates" as const,
    label: "Templates",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  },
  {
    id: "ai" as const,
    label: "AI",
    icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  },
];

export function EditorToolRail({ activePanel, onToggle }: Props) {
  return (
    <div className="w-14 bg-white border-r border-border-gray flex flex-col items-center py-2 gap-1 shrink-0">
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToggle(t.id)}
          className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg text-[9px] transition-colors ${
            activePanel === t.id
              ? "bg-bora-blue-light text-bora-blue"
              : "text-slate hover:bg-lab-white hover:text-ink-black"
          }`}
          title={t.label}
        >
          <svg className="w-4.5 h-4.5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

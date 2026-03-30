import { templates, type Template } from "../../data/templates";

interface Props {
  onApplyTemplate?: (template: Template) => void;
}

const fieldColors: Record<string, string> = {
  "Cell Biology": "from-blue-100 to-indigo-50",
  Genetics: "from-green-100 to-emerald-50",
  Immunology: "from-orange-100 to-amber-50",
  Neuroscience: "from-purple-100 to-violet-50",
  "Molecular Biology": "from-rose-100 to-pink-50",
  Pharmacology: "from-teal-100 to-cyan-50",
};

export function TemplatePanel({ onApplyTemplate }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <p className="text-[11px] text-slate mb-3">
        Start from a pre-built scientific figure template.
      </p>
      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onApplyTemplate?.(t)}
            className="w-full text-left rounded-lg border border-border-gray bg-white hover:border-bora-blue hover:shadow-sm transition-all overflow-hidden group"
          >
            <div
              className={`h-16 bg-gradient-to-br ${fieldColors[t.field] ?? "from-gray-100 to-slate-50"} flex items-center justify-center`}
            >
              <svg
                className="w-6 h-6 text-bora-blue/25 group-hover:text-bora-blue/50 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-ink-black truncate">{t.title}</p>
              <p className="text-[10px] text-slate">{t.field}</p>
              <p className="text-[9px] text-slate/60 mt-0.5 line-clamp-1">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

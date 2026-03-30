interface PageData {
  id: number;
  label: string;
  json: string;
}

interface Props {
  zoom: number;
  onZoomChange: (z: number) => void;
  objectCount?: number;
  pages?: PageData[];
  currentPage?: number;
  onSwitchPage?: (id: number) => void;
  onAddPage?: () => void;
  onDeletePage?: (id: number) => void;
}

export function EditorStatusBar({
  zoom,
  onZoomChange,
  objectCount = 0,
  pages = [],
  currentPage = 1,
  onSwitchPage,
  onAddPage,
  onDeletePage,
}: Props) {
  const clamp = (v: number) => Math.max(25, Math.min(400, v));

  return (
    <div className="h-9 bg-white border-t border-border-gray flex items-center justify-between px-3 text-[11px] text-slate shrink-0">
      {/* Left — pages */}
      <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`group flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer whitespace-nowrap ${
              page.id === currentPage
                ? "bg-bora-blue-light text-bora-blue font-medium"
                : "hover:bg-lab-white"
            }`}
            onClick={() => onSwitchPage?.(page.id)}
          >
            <span>{page.label}</span>
            {pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage?.(page.id);
                }}
                className="hidden group-hover:flex w-3.5 h-3.5 items-center justify-center rounded-sm text-slate hover:text-red-500 hover:bg-red-50"
                title="Delete page"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={onAddPage}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-lab-white text-slate hover:text-ink-black text-sm"
          title="Add page"
        >
          +
        </button>
        <div className="h-4 w-px bg-border-gray mx-2" />
        <span>{objectCount} object{objectCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Right — zoom */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onZoomChange(clamp(zoom - 10))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-lab-white"
        >
          −
        </button>
        <input
          type="range"
          min={25}
          max={400}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 accent-bora-blue"
        />
        <button
          onClick={() => onZoomChange(clamp(zoom + 10))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-lab-white"
        >
          +
        </button>
        <span className="w-10 text-center tabular-nums">{zoom}%</span>
      </div>
    </div>
  );
}

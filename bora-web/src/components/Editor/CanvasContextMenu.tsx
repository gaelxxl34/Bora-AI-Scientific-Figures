import { useEffect, useRef } from "react";

export interface ContextMenuAction {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerAfter?: boolean;
  disabled?: boolean;
  submenu?: ContextMenuAction[];
}

interface Props {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function CanvasContextMenu({ x, y, actions, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        (!subRef.current || !subRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position so menu stays on screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-border-gray py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {actions.map((action, i) => (
        <div key={i}>
          {action.submenu ? (
            <SubMenuItem action={action} subRef={subRef} onClose={onClose} />
          ) : (
            <button
              onClick={() => {
                if (!action.disabled) {
                  action.onClick();
                  onClose();
                }
              }}
              disabled={action.disabled}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left transition-colors ${
                action.disabled
                  ? "text-slate/40 cursor-default"
                  : action.danger
                    ? "text-ink-black hover:bg-red-50 hover:text-red-600"
                    : "text-ink-black hover:bg-bora-blue-light"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {action.icon && <span className="w-4 h-4 flex items-center justify-center text-slate">{action.icon}</span>}
                {action.label}
              </span>
              {action.shortcut && (
                <span className="text-[11px] text-slate/60 ml-6">{action.shortcut}</span>
              )}
            </button>
          )}
          {action.dividerAfter && <div className="h-px bg-border-gray my-1" />}
        </div>
      ))}
    </div>
  );
}

/* ── Submenu item ── */
function SubMenuItem({
  action,
  subRef,
  onClose,
}: {
  action: ContextMenuAction;
  subRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const showSub = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subRefAny = subRef as any;

  return (
    <div
      ref={itemRef}
      className="relative group"
      onMouseEnter={() => (showSub.current = true)}
      onMouseLeave={() => (showSub.current = false)}
    >
      <div className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-ink-black hover:bg-bora-blue-light cursor-default">
        <span className="flex items-center gap-2.5">
          {action.icon && <span className="w-4 h-4 flex items-center justify-center text-slate">{action.icon}</span>}
          {action.label}
        </span>
        <svg className="w-3 h-3 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </div>

      {/* Submenu appears on hover */}
      <div
        ref={subRefAny}
        className="hidden group-hover:block absolute left-full top-0 ml-0.5 bg-white rounded-lg shadow-lg border border-border-gray py-1.5 min-w-[180px] z-[101]"
      >
        {action.submenu?.map((sub, j) => (
          <button
            key={j}
            onClick={() => {
              sub.onClick();
              onClose();
            }}
            disabled={sub.disabled}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left ${
              sub.disabled ? "text-slate/40 cursor-default" : "text-ink-black hover:bg-bora-blue-light"
            }`}
          >
            <span className="flex items-center gap-2.5">
              {sub.icon && <span className="w-4 h-4 flex items-center justify-center text-slate">{sub.icon}</span>}
              {sub.label}
            </span>
            {sub.shortcut && <span className="text-[11px] text-slate/60 ml-6">{sub.shortcut}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";

export interface TextInfo {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fill: string;
  textAlign: string;
}

interface Props {
  /** Bounding box of the selected objects in screen coords */
  bounds: { left: number; top: number; width: number; height: number };
  isLocked: boolean;
  hasClipboard: boolean;
  /** Non-null when at least one text object is selected */
  textInfo: TextInfo | null;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  // Text formatting
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetFontSize?: (size: number) => void;
  onSetFillColor?: (color: string) => void;
  onSetTextAlign?: (align: string) => void;
}

export function SelectionToolbar({
  bounds,
  isLocked,
  hasClipboard,
  textInfo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetFontSize,
  onSetFillColor,
  onSetTextAlign,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [layerOpen, setLayerOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!layerOpen && !colorOpen && !alignOpen) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setLayerOpen(false);
        setColorOpen(false);
        setAlignOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [layerOpen, colorOpen, alignOpen]);

  // Position: centered above the selection bounding box
  const toolbarWidth = textInfo ? 480 : 280;
  let left = bounds.left + bounds.width / 2 - toolbarWidth / 2;
  let top = bounds.top - 48;

  // Keep on-screen
  if (left < 8) left = 8;
  if (left + toolbarWidth > window.innerWidth - 8) left = window.innerWidth - toolbarWidth - 8;
  if (top < 8) top = bounds.top + bounds.height + 8;

  return (
    <div
      ref={barRef}
      className="fixed z-[90] flex items-center gap-0.5 h-9 px-1.5 bg-white rounded-lg shadow-lg border border-border-gray"
      style={{ left, top, minWidth: toolbarWidth }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Text formatting (only when text selected) ── */}
      {textInfo && (
        <>
          {/* Font size stepper */}
          <button
            title="Decrease font size"
            onClick={() => onSetFontSize?.(Math.max(8, textInfo.fontSize - 1))}
            className="w-6 h-7 flex items-center justify-center rounded text-slate hover:bg-lab-white hover:text-ink-black text-xs font-medium"
          >
            −
          </button>
          <span className="text-[11px] font-mono text-ink-black tabular-nums w-6 text-center select-none">
            {textInfo.fontSize}
          </span>
          <button
            title="Increase font size"
            onClick={() => onSetFontSize?.(Math.min(120, textInfo.fontSize + 1))}
            className="w-6 h-7 flex items-center justify-center rounded text-slate hover:bg-lab-white hover:text-ink-black text-xs font-medium"
          >
            +
          </button>

          <Divider />

          {/* Bold */}
          <ToolBtn title="Bold (⌘B)" onClick={() => onToggleBold?.()} active={textInfo.isBold}>
            <span className="text-xs font-bold">B</span>
          </ToolBtn>

          {/* Italic */}
          <ToolBtn title="Italic (⌘I)" onClick={() => onToggleItalic?.()} active={textInfo.isItalic}>
            <span className="text-xs italic font-serif">I</span>
          </ToolBtn>

          {/* Underline */}
          <ToolBtn title="Underline (⌘U)" onClick={() => onToggleUnderline?.()} active={textInfo.isUnderline}>
            <span className="text-xs underline">U</span>
          </ToolBtn>

          <Divider />

          {/* Text alignment dropdown */}
          <div className="relative">
            <ToolBtn title="Alignment" onClick={() => { setAlignOpen(!alignOpen); setColorOpen(false); setLayerOpen(false); }} active={alignOpen}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {textInfo.textAlign === "center" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
                ) : textInfo.textAlign === "right" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5M3.75 17.25h16.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5M3.75 17.25h16.5" />
                )}
              </svg>
            </ToolBtn>
            {alignOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white rounded-lg shadow-lg border border-border-gray py-1 min-w-[120px] z-[91]">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => { onSetTextAlign?.(a); setAlignOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-bora-blue-light ${textInfo.textAlign === a ? "text-bora-blue font-medium" : "text-ink-black"}`}
                  >
                    <span className="capitalize">{a}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Fill color */}
          <div className="relative">
            <button
              title="Text color"
              onClick={() => { setColorOpen(!colorOpen); setAlignOpen(false); setLayerOpen(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-lab-white"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold leading-none" style={{ color: textInfo.fill }}>A</span>
                <div className="w-4 h-1 rounded-full mt-px" style={{ backgroundColor: textInfo.fill }} />
              </div>
            </button>
            {colorOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white rounded-lg shadow-lg border border-border-gray p-2 z-[91]">
                <div className="grid grid-cols-6 gap-1">
                  {[
                    "#0f1117", "#374151", "#6b7280", "#9ca3af",
                    "#dc2626", "#f97316", "#f59e0b", "#eab308",
                    "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
                    "#3b82f6", "#1a6bdb", "#6366f1", "#8b5cf6",
                    "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
                    "#ffffff", "#f3f4f6", "#e5e7eb", "#d1d5db",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => { onSetFillColor?.(c); setColorOpen(false); }}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${textInfo.fill === c ? "border-bora-blue ring-1 ring-bora-blue" : "border-border-gray"}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />
        </>
      )}

      {/* Copy */}
      <ToolBtn title="Copy (⌘C)" onClick={onCopy}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m0 0a2.625 2.625 0 1 1 5.25 0" />
        </svg>
      </ToolBtn>

      {/* Paste */}
      <ToolBtn title="Paste (⌘V)" onClick={onPaste} disabled={!hasClipboard}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </ToolBtn>

      <Divider />

      {/* Duplicate */}
      <ToolBtn title="Duplicate (⌘D)" onClick={onDuplicate}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9h3.375c.621 0 1.125-.504 1.125-1.125V3.375c0-.621-.504-1.125-1.125-1.125h-9.75a1.125 1.125 0 0 0-1.125 1.125V6.75" />
        </svg>
      </ToolBtn>

      <Divider />

      {/* Layer dropdown */}
      <div className="relative">
        <ToolBtn title="Layer" onClick={() => setLayerOpen(!layerOpen)} active={layerOpen}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0 4.179 2.25-9.75 5.25-9.75-5.25" />
          </svg>
        </ToolBtn>

        {layerOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white rounded-lg shadow-lg border border-border-gray py-1 min-w-[160px] z-[91]">
            <DropItem label="Bring forward" shortcut="⌘]" onClick={() => { onBringForward(); setLayerOpen(false); }} />
            <DropItem label="Send backward" shortcut="⌘[" onClick={() => { onSendBackward(); setLayerOpen(false); }} />
            <div className="h-px bg-border-gray my-0.5" />
            <DropItem label="Bring to front" shortcut="⌘⇧]" onClick={() => { onBringToFront(); setLayerOpen(false); }} />
            <DropItem label="Send to back" shortcut="⌘⇧[" onClick={() => { onSendToBack(); setLayerOpen(false); }} />
          </div>
        )}
      </div>

      <Divider />

      {/* Lock / Unlock */}
      <ToolBtn title={isLocked ? "Unlock" : "Lock"} onClick={onToggleLock}>
        {isLocked ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        )}
      </ToolBtn>

      <Divider />

      {/* Delete */}
      <ToolBtn title="Delete (⌫)" onClick={onDelete} danger>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </ToolBtn>

      {/* More (three dots) */}
      <ToolBtn title="More options" onClick={() => {}}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </ToolBtn>
    </div>
  );
}

/* ── Small sub-components ── */

function ToolBtn({
  children,
  title,
  onClick,
  disabled,
  active,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
        disabled
          ? "text-slate/30 cursor-default"
          : active
            ? "bg-bora-blue-light text-bora-blue"
            : danger
              ? "text-slate hover:bg-red-50 hover:text-red-600"
              : "text-slate hover:bg-lab-white hover:text-ink-black"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border-gray mx-0.5" />;
}

function DropItem({
  label,
  shortcut,
  onClick,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-ink-black hover:bg-bora-blue-light"
    >
      <span>{label}</span>
      {shortcut && <span className="text-[10px] text-slate/50 ml-4">{shortcut}</span>}
    </button>
  );
}

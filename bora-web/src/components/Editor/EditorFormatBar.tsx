import { type RefObject } from "react";
import type { CanvasHandle, SelectionInfo } from "./EditorCanvas";

interface Props {
  selection: SelectionInfo;
  canvasRef: RefObject<CanvasHandle | null>;
}

const FONTS = [
  "Inter",
  "Arial",
  "Times New Roman",
  "Georgia",
  "JetBrains Mono",
  "Courier New",
  "Helvetica",
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];

export function EditorFormatBar({ selection, canvasRef }: Props) {
  if (selection.type === "none") return null;

  const c = canvasRef.current;
  const isText = selection.type === "text" || selection.type === "mixed";

  return (
    <div className="flex items-center gap-1 h-10 px-3 bg-white border-b border-border-gray shrink-0 text-xs text-slate overflow-x-auto">
      {/* Font Family */}
      {isText && (
        <select
          value={selection.fontFamily ?? "Inter"}
          onChange={(e) => c?.setFontFamily(e.target.value)}
          className="h-7 px-2 rounded border border-border-gray bg-white text-ink-black text-xs outline-none hover:border-bora-blue focus:border-bora-blue w-32"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      )}

      {/* Font Size */}
      {isText && (
        <select
          value={selection.fontSize ?? 16}
          onChange={(e) => c?.setFontSize(Number(e.target.value))}
          className="h-7 px-1 rounded border border-border-gray bg-white text-ink-black text-xs outline-none hover:border-bora-blue focus:border-bora-blue w-16 text-center"
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {isText && <div className="h-5 w-px bg-border-gray mx-1" />}

      {/* Bold */}
      {isText && (
        <button
          onClick={() => c?.toggleBold()}
          className={`w-7 h-7 flex items-center justify-center rounded font-bold ${selection.fontWeight === "bold" ? "bg-bora-blue-light text-bora-blue" : "hover:bg-lab-white"}`}
          title="Bold (⌘B)"
        >
          B
        </button>
      )}

      {/* Italic */}
      {isText && (
        <button
          onClick={() => c?.toggleItalic()}
          className={`w-7 h-7 flex items-center justify-center rounded italic ${selection.fontStyle === "italic" ? "bg-bora-blue-light text-bora-blue" : "hover:bg-lab-white"}`}
          title="Italic (⌘I)"
        >
          I
        </button>
      )}

      {/* Underline */}
      {isText && (
        <button
          onClick={() => c?.toggleUnderline()}
          className={`w-7 h-7 flex items-center justify-center rounded underline ${selection.underline ? "bg-bora-blue-light text-bora-blue" : "hover:bg-lab-white"}`}
          title="Underline (⌘U)"
        >
          U
        </button>
      )}

      {isText && <div className="h-5 w-px bg-border-gray mx-1" />}

      {/* Text Align */}
      {isText && (
        <div className="flex items-center gap-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => c?.setTextAlign(align)}
              className={`w-7 h-7 flex items-center justify-center rounded ${selection.textAlign === align ? "bg-bora-blue-light text-bora-blue" : "hover:bg-lab-white"}`}
              title={`Align ${align}`}
            >
              {align === "left" && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M3 12h12M3 18h16" />
                </svg>
              )}
              {align === "center" && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M6 12h12M4 18h16" />
                </svg>
              )}
              {align === "right" && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M9 12h12M5 18h16" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="h-5 w-px bg-border-gray mx-1" />

      {/* Fill Color */}
      <label className="flex items-center gap-1 cursor-pointer" title="Fill color">
        <div className="w-5 h-5 rounded border border-border-gray overflow-hidden relative">
          <input
            type="color"
            value={selection.fill ?? "#000000"}
            onChange={(e) => c?.setFillColor(e.target.value)}
            className="absolute inset-0 w-8 h-8 -top-1 -left-1 cursor-pointer opacity-0"
          />
          <div className="w-full h-full" style={{ backgroundColor: selection.fill ?? "#000000" }} />
        </div>
        <span className="text-[10px]">Fill</span>
      </label>

      {/* Stroke Color */}
      <label className="flex items-center gap-1 cursor-pointer ml-1" title="Stroke color">
        <div className="w-5 h-5 rounded border-2 border-border-gray overflow-hidden relative">
          <input
            type="color"
            value="#000000"
            onChange={(e) => c?.setStrokeColor(e.target.value)}
            className="absolute inset-0 w-8 h-8 -top-1 -left-1 cursor-pointer opacity-0"
          />
          <div className="w-full h-full bg-white" />
        </div>
        <span className="text-[10px]">Stroke</span>
      </label>

      <div className="h-5 w-px bg-border-gray mx-1" />

      {/* Delete */}
      <button
        onClick={() => c?.deleteSelected()}
        className="h-7 px-2 flex items-center gap-1 rounded hover:bg-red-50 hover:text-red-600"
        title="Delete (⌫)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        <span className="text-[10px]">Delete</span>
      </button>
    </div>
  );
}

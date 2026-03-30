import { IconPanel } from "../IconLibrary/IconPanel";
import { TemplatePanel } from "./TemplatePanel";
import { AIPanel } from "./AIPanel";
import type { Icon } from "../../types/icon.types";
import type { Template } from "../../data/templates";
import type { CanvasHandle } from "./EditorCanvas";
import type { RefObject } from "react";

interface Props {
  panel: "search" | "text" | "shapes" | "templates" | "ai";
  onClose: () => void;
  onAddText?: (preset: "heading" | "subheading" | "body" | "label") => void;
  onAddShape?: (shape: string) => void;
  onAddIcon?: (icon: Icon) => void;
  onApplyTemplate?: (template: Template) => void;
  canvasContext?: string | null;
  canvasRef?: RefObject<CanvasHandle | null>;
  onCanvasChanged?: () => void;
  initialChatMessages?: Array<{ role: string; content: string; commandsExecuted?: number }>;
  onChatMessagesChange?: (messages: Array<{ role: string; content: string; commandsExecuted?: number }>) => void;
}

export function EditorSidePanel({ panel, onClose, onAddText, onAddShape, onAddIcon, onApplyTemplate, canvasContext, canvasRef, onCanvasChanged, initialChatMessages, onChatMessagesChange }: Props) {

  return (
    <div className="w-72 bg-white border-r border-border-gray flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-ink-black">
          {panel === "search" && "Icons"}
          {panel === "text" && "Text"}
          {panel === "shapes" && "Shapes & Lines"}
          {panel === "templates" && "Templates"}
          {panel === "ai" && "AI Generate"}
        </h3>
        <button onClick={onClose} className="text-slate hover:text-ink-black p-1 rounded hover:bg-lab-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search / Icon Library panel */}
      {panel === "search" && (
        <IconPanel onSelectIcon={onAddIcon} />
      )}

      {/* Text panel */}
      {panel === "text" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {[
              { label: "Heading", size: "text-lg font-bold", preset: "heading" as const },
              { label: "Subheading", size: "text-sm font-semibold", preset: "subheading" as const },
              { label: "Body text", size: "text-xs", preset: "body" as const },
              { label: "Label", size: "text-[10px] font-mono uppercase", preset: "label" as const },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => onAddText?.(t.preset)}
                className="w-full text-left px-3 py-3 rounded-lg border border-border-gray hover:border-bora-blue hover:shadow-sm transition-all"
              >
                <span className={`${t.size} text-ink-black`}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shapes panel */}
      {panel === "shapes" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {["Rectangle", "Circle", "Triangle", "Arrow", "Line", "Bracket"].map((s) => (
              <button
                key={s}
                onClick={() => onAddShape?.(s)}
                className="aspect-square rounded-lg border border-border-gray bg-lab-white hover:border-bora-blue hover:shadow-sm transition-all flex flex-col items-center justify-center gap-1"
              >
                <div className="w-8 h-8 rounded bg-border-gray/50" />
                <span className="text-[9px] text-slate">{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates panel */}
      {panel === "templates" && (
        <TemplatePanel onApplyTemplate={onApplyTemplate} />
      )}

      {/* AI panel */}
      {panel === "ai" && (
        <AIPanel canvasContext={canvasContext} canvasRef={canvasRef} onCanvasChanged={onCanvasChanged} initialMessages={initialChatMessages as any} onMessagesChange={onChatMessagesChange as any} />
      )}
    </div>
  );
}

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { fabric } from "fabric";
import { SelectionToolbar } from "./SelectionToolbar";
import { loadTemplateOntoCanvas } from "../../utils/templateLoader";

/* ── Selection info for formatting toolbar ── */
export interface SelectionInfo {
  type: "none" | "text" | "object" | "mixed";
  count: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  fill?: string;
  textAlign?: string;
}

/* ── Public handle exposed via ref ── */
export interface CanvasHandle {
  addText: (preset: "heading" | "subheading" | "body" | "label") => void;
  addShape: (shape: string) => void;
  addIcon: (svgContent: string, name?: string) => void;
  getObjectCount: () => number;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  exportJSON: () => string;
  exportPNG: (multiplier?: number) => string;
  exportSVG: () => string;
  // Formatting
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setTextAlign: (align: string) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  // Clipboard & layers
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  toggleLock: () => void;
  // Pages
  getCanvasJSON: () => string;
  loadCanvasJSON: (json: string) => void;
  // Templates
  applyTemplate: (template: import("../../data/templates").Template) => Promise<void>;
  // Raw canvas access (for AI command execution)
  getFabricCanvas: () => fabric.Canvas | null;
  // AI generation overlay
  setGenerating: (active: boolean) => void;
  // Describe canvas objects for AI context
  getCanvasDescription: () => string;
}

interface Props {
  zoom: number;
  onObjectCountChange?: (count: number) => void;
  onSelectionChange?: (info: SelectionInfo) => void;
}

/* ── Canvas dimensions (96 DPI → 10×7 in) ── */
const CW = 960;
const CH = 672;

export const EditorCanvas = forwardRef<CanvasHandle, Props>(
  ({ zoom, onObjectCountChange, onSelectionChange }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fcRef = useRef<fabric.Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIdx = useRef(-1);
    const ignoreHistory = useRef(false);
    const clipboardRef = useRef<fabric.Object | null>(null);

    /* ── Selection toolbar state ── */
    const [selBounds, setSelBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    /* ── AI generation overlay ── */
    const [isGenerating, setIsGenerating] = useState(false);

    /* ── helpers ── */
    const emitCount = useCallback(() => {
      if (!fcRef.current) return;
      onObjectCountChange?.(fcRef.current.getObjects().length);
    }, [onObjectCountChange]);

    const pushHistory = useCallback(() => {
      if (ignoreHistory.current || !fcRef.current) return;
      const json = JSON.stringify(fcRef.current.toJSON());
      historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
      historyRef.current.push(json);
      historyIdx.current = historyRef.current.length - 1;
    }, []);

    const getSelectionInfo = useCallback((): SelectionInfo => {
      const fc = fcRef.current;
      if (!fc) return { type: "none", count: 0 };
      const active = fc.getActiveObjects();
      if (active.length === 0) return { type: "none", count: 0 };

      const hasText = active.some((o) => o.type === "i-text" || o.type === "textbox" || o.type === "text");
      const hasNonText = active.some((o) => o.type !== "i-text" && o.type !== "textbox" && o.type !== "text");

      let info: SelectionInfo = {
        type: hasText && hasNonText ? "mixed" : hasText ? "text" : "object",
        count: active.length,
      };

      // Get text formatting from first text object
      if (hasText) {
        const textObj = active.find((o) => o.type === "i-text" || o.type === "textbox" || o.type === "text") as fabric.IText | undefined;
        if (textObj) {
          info.fontFamily = textObj.fontFamily;
          info.fontSize = textObj.fontSize;
          info.fontWeight = String(textObj.fontWeight || "normal");
          info.fontStyle = textObj.fontStyle;
          info.underline = textObj.underline;
          info.fill = typeof textObj.fill === "string" ? textObj.fill : "#000000";
          info.textAlign = textObj.textAlign;
        }
      }

      if (!hasText && active.length === 1) {
        info.fill = typeof active[0].fill === "string" ? active[0].fill : undefined;
      }

      return info;
    }, []);

    const updateSelBounds = useCallback(() => {
      const fc = fcRef.current;
      if (!fc) { setSelBounds(null); return; }
      const active = fc.getActiveObject();
      if (!active) { setSelBounds(null); setIsLocked(false); return; }
      // Skip toolbar while editing text
      if ((active.type === "i-text" || active.type === "textbox") && (active as fabric.IText).isEditing) {
        setSelBounds(null); return;
      }
      const bound = active.getBoundingRect();
      const canvasEl = (fc as any).upperCanvasEl as HTMLCanvasElement;
      const canvasRect = canvasEl.getBoundingClientRect();
      setSelBounds({
        left: canvasRect.left + bound.left,
        top: canvasRect.top + bound.top,
        width: bound.width,
        height: bound.height,
      });
      setIsLocked(active.lockMovementX ?? false);
    }, []);

    const emitSelection = useCallback(() => {
      onSelectionChange?.(getSelectionInfo());
      updateSelBounds();
    }, [onSelectionChange, getSelectionInfo, updateSelBounds]);

    /* ── Delete selected helper ── */
    const doDelete = useCallback(() => {
      const fc = fcRef.current;
      if (!fc) return;
      // Don't delete while editing text
      const active = fc.getActiveObject();
      if (active && (active.type === "i-text" || active.type === "textbox") && (active as fabric.IText).isEditing) return;

      const objects = fc.getActiveObjects();
      if (objects.length === 0) return;
      objects.forEach((o) => fc.remove(o));
      fc.discardActiveObject();
      fc.renderAll();
    }, []);

    /* ── Initialise Fabric canvas ── */
    useEffect(() => {
      if (!canvasElRef.current || fcRef.current) return;

      const fc = new fabric.Canvas(canvasElRef.current, {
        width: CW,
        height: CH,
        backgroundColor: "#ffffff",
        selection: true,
        preserveObjectStacking: true,
      });

      fc.on("object:added", () => { pushHistory(); emitCount(); });
      fc.on("object:removed", () => { pushHistory(); emitCount(); });
      fc.on("object:modified", () => { pushHistory(); emitCount(); emitSelection(); });
      fc.on("selection:created", () => emitSelection());
      fc.on("selection:updated", () => emitSelection());
      fc.on("selection:cleared", () => emitSelection());
      fc.on("object:moving", () => setSelBounds(null));
      fc.on("object:scaling", () => setSelBounds(null));
      fc.on("object:rotating", () => setSelBounds(null));
      fc.on("text:editing:entered", () => setSelBounds(null));
      fc.on("text:editing:exited", () => updateSelBounds());

      fcRef.current = fc;
      pushHistory(); // initial empty state

      // Keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!fcRef.current) return;
        const target = e.target as HTMLElement;
        // Don't intercept typing in inputs/textareas
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

        // Delete / Backspace
        if (e.key === "Delete" || e.key === "Backspace") {
          doDelete();
          e.preventDefault();
        }
        // Ctrl/Cmd + Z = Undo
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
          const fc2 = fcRef.current;
          if (!fc2 || historyIdx.current <= 0) return;
          historyIdx.current -= 1;
          ignoreHistory.current = true;
          fc2.loadFromJSON(historyRef.current[historyIdx.current], () => {
            fc2.renderAll();
            ignoreHistory.current = false;
            emitCount();
          });
          e.preventDefault();
        }
        // Ctrl/Cmd + Shift + Z = Redo
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
          const fc2 = fcRef.current;
          if (!fc2 || historyIdx.current >= historyRef.current.length - 1) return;
          historyIdx.current += 1;
          ignoreHistory.current = true;
          fc2.loadFromJSON(historyRef.current[historyIdx.current], () => {
            fc2.renderAll();
            ignoreHistory.current = false;
            emitCount();
          });
          e.preventDefault();
        }
        // Ctrl/Cmd + A = Select all
        if ((e.metaKey || e.ctrlKey) && e.key === "a") {
          const fc2 = fcRef.current;
          if (!fc2) return;
          fc2.discardActiveObject();
          const sel = new fabric.ActiveSelection(fc2.getObjects(), { canvas: fc2 });
          fc2.setActiveObject(sel);
          fc2.requestRenderAll();
          e.preventDefault();
        }
        // Ctrl/Cmd + C = Copy
        if ((e.metaKey || e.ctrlKey) && e.key === "c" && !e.shiftKey) {
          const fc2 = fcRef.current;
          if (!fc2) return;
          const active = fc2.getActiveObject();
          if (active && !(active.type === "i-text" && (active as fabric.IText).isEditing)) {
            active.clone((cloned: fabric.Object) => { clipboardRef.current = cloned; });
            e.preventDefault();
          }
        }
        // Ctrl/Cmd + V = Paste
        if ((e.metaKey || e.ctrlKey) && e.key === "v") {
          const fc2 = fcRef.current;
          if (!fc2 || !clipboardRef.current) return;
          clipboardRef.current.clone((cloned: fabric.Object) => {
            fc2.discardActiveObject();
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
            if (cloned.type === "activeSelection") {
              (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc2.add(o));
              cloned.setCoords();
            } else {
              fc2.add(cloned);
            }
            clipboardRef.current!.set({ left: (clipboardRef.current!.left ?? 0) + 20, top: (clipboardRef.current!.top ?? 0) + 20 });
            fc2.setActiveObject(cloned);
            fc2.requestRenderAll();
          });
          e.preventDefault();
        }
        // Ctrl/Cmd + D = Duplicate
        if ((e.metaKey || e.ctrlKey) && e.key === "d") {
          const fc2 = fcRef.current;
          if (!fc2) return;
          const active = fc2.getActiveObject();
          if (!active) return;
          active.clone((cloned: fabric.Object) => {
            fc2.discardActiveObject();
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
            if (cloned.type === "activeSelection") {
              (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc2.add(o));
              cloned.setCoords();
            } else {
              fc2.add(cloned);
            }
            fc2.setActiveObject(cloned);
            fc2.requestRenderAll();
          });
          e.preventDefault();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        fc.dispose();
        fcRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Zoom ── */
    useEffect(() => {
      const fc = fcRef.current;
      if (!fc) return;
      const scale = zoom / 100;
      fc.setZoom(scale);
      fc.setWidth(CW * scale);
      fc.setHeight(CH * scale);
      fc.renderAll();
    }, [zoom]);

    /* ── Imperative handle ── */
    useImperativeHandle(
      ref,
      () => ({
        addText(preset) {
          const fc = fcRef.current;
          if (!fc) return;
          const styles: Record<string, Partial<fabric.ITextOptions>> = {
            heading: { fontSize: 32, fontWeight: "bold", fontFamily: "Inter" },
            subheading: { fontSize: 22, fontWeight: "600", fontFamily: "Inter" },
            body: { fontSize: 16, fontFamily: "Inter" },
            label: { fontSize: 11, fontFamily: "JetBrains Mono" },
          };
          const opts = styles[preset] ?? styles.body;
          const text = new fabric.IText(preset.charAt(0).toUpperCase() + preset.slice(1), {
            left: CW / 2 - 60,
            top: CH / 2 - 20,
            fill: "#0f1117",
            ...opts,
          });
          fc.add(text);
          fc.setActiveObject(text);
          fc.renderAll();
        },

        addShape(shape) {
          const fc = fcRef.current;
          if (!fc) return;
          const cx = CW / 2;
          const cy = CH / 2;

          let obj: fabric.Object | null = null;

          switch (shape) {
            case "Rectangle":
              obj = new fabric.Rect({
                left: cx - 60,
                top: cy - 40,
                width: 120,
                height: 80,
                fill: "transparent",
                stroke: "#0f1117",
                strokeWidth: 2,
                rx: 4,
                ry: 4,
              });
              break;
            case "Circle":
              obj = new fabric.Circle({
                left: cx - 40,
                top: cy - 40,
                radius: 40,
                fill: "transparent",
                stroke: "#0f1117",
                strokeWidth: 2,
              });
              break;
            case "Triangle":
              obj = new fabric.Triangle({
                left: cx - 40,
                top: cy - 40,
                width: 80,
                height: 80,
                fill: "transparent",
                stroke: "#0f1117",
                strokeWidth: 2,
              });
              break;
            case "Arrow": {
              const line = new fabric.Line([cx - 60, cy, cx + 60, cy], {
                stroke: "#0f1117",
                strokeWidth: 2,
              });
              const head = new fabric.Triangle({
                left: cx + 48,
                top: cy - 8,
                width: 16,
                height: 16,
                fill: "#0f1117",
                angle: 90,
              });
              const group = new fabric.Group([line, head], { left: cx - 60, top: cy - 8 });
              obj = group;
              break;
            }
            case "Line":
              obj = new fabric.Line([cx - 80, cy, cx + 80, cy], {
                stroke: "#0f1117",
                strokeWidth: 2,
              });
              break;
            case "Bracket":
              obj = new fabric.Path(
                `M ${cx - 30} ${cy - 40} Q ${cx - 50} ${cy - 40} ${cx - 50} ${cy} Q ${cx - 50} ${cy + 40} ${cx - 30} ${cy + 40}`,
                { fill: "transparent", stroke: "#0f1117", strokeWidth: 2 }
              );
              break;
            default:
              return;
          }

          if (obj) {
            fc.add(obj);
            fc.setActiveObject(obj);
            fc.renderAll();
          }
        },

        getObjectCount: () => fcRef.current?.getObjects().length ?? 0,

        addIcon(svgContent, name) {
          const fc = fcRef.current;
          if (!fc) return;
          const cleanSvg = svgContent.replace(/<\?xml[^?]*\?>\s*/gi, "").replace(/<!DOCTYPE[^>[]*?(\[[^\]]*\])?\s*>\s*/gi, "").replace(/<!--[\s\S]*?-->\s*/g, "").trimStart();
          fabric.loadSVGFromString(cleanSvg, (objects, options) => {
            const group = fabric.util.groupSVGElements(objects, options);
            // Scale to fit ~80px wide, preserving aspect ratio
            const scale = Math.min(80 / (group.width ?? 80), 80 / (group.height ?? 80));
            group.set({
              left: CW / 2 - 40,
              top: CH / 2 - 40,
              scaleX: scale,
              scaleY: scale,
            });
            if (name) group.set({ name } as any);
            fc.add(group);
            fc.setActiveObject(group);
            fc.renderAll();
          });
        },

        undo() {
          const fc = fcRef.current;
          if (!fc || historyIdx.current <= 0) return;
          historyIdx.current -= 1;
          ignoreHistory.current = true;
          fc.loadFromJSON(historyRef.current[historyIdx.current], () => {
            fc.renderAll();
            ignoreHistory.current = false;
            emitCount();
          });
        },

        redo() {
          const fc = fcRef.current;
          if (!fc || historyIdx.current >= historyRef.current.length - 1) return;
          historyIdx.current += 1;
          ignoreHistory.current = true;
          fc.loadFromJSON(historyRef.current[historyIdx.current], () => {
            fc.renderAll();
            ignoreHistory.current = false;
            emitCount();
          });
        },

        deleteSelected() {
          doDelete();
        },

        exportJSON: () => JSON.stringify(fcRef.current?.toJSON() ?? {}),
        exportPNG: (multiplier = 2) => fcRef.current?.toDataURL({ format: "png", multiplier }) ?? "",
        exportSVG: () => fcRef.current?.toSVG() ?? "",

        /* ── Clipboard ── */
        copy() {
          const fc = fcRef.current;
          if (!fc) return;
          const active = fc.getActiveObject();
          if (!active) return;
          active.clone((cloned: fabric.Object) => {
            clipboardRef.current = cloned;
          });
        },
        paste() {
          const fc = fcRef.current;
          if (!fc || !clipboardRef.current) return;
          clipboardRef.current.clone((cloned: fabric.Object) => {
            fc.discardActiveObject();
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
            if (cloned.type === "activeSelection") {
              (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc.add(o));
              cloned.setCoords();
            } else {
              fc.add(cloned);
            }
            clipboardRef.current!.set({ left: (clipboardRef.current!.left ?? 0) + 20, top: (clipboardRef.current!.top ?? 0) + 20 });
            fc.setActiveObject(cloned);
            fc.requestRenderAll();
          });
        },
        duplicate() {
          const fc = fcRef.current;
          if (!fc) return;
          const active = fc.getActiveObject();
          if (!active) return;
          active.clone((cloned: fabric.Object) => {
            fc.discardActiveObject();
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
            if (cloned.type === "activeSelection") {
              (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc.add(o));
              cloned.setCoords();
            } else {
              fc.add(cloned);
            }
            fc.setActiveObject(cloned);
            fc.requestRenderAll();
          });
        },

        /* ── Layer ordering ── */
        bringForward() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj) { fc.bringForward(obj); fc.renderAll(); pushHistory(); }
        },
        sendBackward() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj) { fc.sendBackwards(obj); fc.renderAll(); pushHistory(); }
        },
        bringToFront() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj) { fc.bringToFront(obj); fc.renderAll(); pushHistory(); }
        },
        sendToBack() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj) { fc.sendToBack(obj); fc.renderAll(); pushHistory(); }
        },

        /* ── Lock / Unlock ── */
        toggleLock() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (!obj) return;
          const locked = obj.lockMovementX;
          obj.set({
            lockMovementX: !locked,
            lockMovementY: !locked,
            lockRotation: !locked,
            lockScalingX: !locked,
            lockScalingY: !locked,
            hasControls: locked,
            selectable: true,
          });
          fc.renderAll();
        },

        /* ── Formatting ── */
        setFontFamily(font) {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            (obj as fabric.IText).set("fontFamily", font);
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        setFontSize(size) {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            (obj as fabric.IText).set("fontSize", size);
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        toggleBold() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            const t = obj as fabric.IText;
            t.set("fontWeight", t.fontWeight === "bold" ? "normal" : "bold");
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        toggleItalic() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            const t = obj as fabric.IText;
            t.set("fontStyle", t.fontStyle === "italic" ? "normal" : "italic");
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        toggleUnderline() {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            const t = obj as fabric.IText;
            t.set("underline", !t.underline);
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        setTextAlign(align) {
          const fc = fcRef.current;
          if (!fc) return;
          const obj = fc.getActiveObject();
          if (obj && (obj.type === "i-text" || obj.type === "textbox")) {
            (obj as fabric.IText).set("textAlign", align);
            fc.renderAll();
            pushHistory();
            emitSelection();
          }
        },
        setFillColor(color) {
          const fc = fcRef.current;
          if (!fc) return;
          fc.getActiveObjects().forEach((o) => {
            o.set("fill", color);
          });
          fc.renderAll();
          pushHistory();
          emitSelection();
        },
        setStrokeColor(color) {
          const fc = fcRef.current;
          if (!fc) return;
          fc.getActiveObjects().forEach((o) => {
            o.set("stroke", color);
          });
          fc.renderAll();
          pushHistory();
        },

        /* ── Page management ── */
        getCanvasJSON() {
          return JSON.stringify(fcRef.current?.toJSON() ?? {});
        },
        loadCanvasJSON(json) {
          const fc = fcRef.current;
          if (!fc) return;
          ignoreHistory.current = true;
          fc.loadFromJSON(json, () => {
            fc.renderAll();
            ignoreHistory.current = false;
            pushHistory();
            emitCount();
          });
        },

        async applyTemplate(template) {
          const fc = fcRef.current;
          if (!fc) return;
          ignoreHistory.current = true;
          await loadTemplateOntoCanvas(fc, template);
          ignoreHistory.current = false;
          pushHistory();
          emitCount();
        },

        getFabricCanvas() {
          return fcRef.current;
        },

        setGenerating(active: boolean) {
          setIsGenerating(active);
        },

        getCanvasDescription() {
          const fc = fcRef.current;
          if (!fc) return "";
          const objs = fc.getObjects();
          if (objs.length === 0) return "Canvas is empty.";
          const items: string[] = [];
          for (const o of objs) {
            if (o.type === "i-text" || o.type === "textbox" || o.type === "text") {
              const t = o as fabric.IText;
              items.push(`Text: "${(t.text ?? "").slice(0, 40)}"`);
            } else if (o.type === "group" && (o as any).name) {
              items.push(`Icon: ${(o as any).name}`);
            } else if (o.type === "group") {
              items.push("Group");
            } else if (o.type === "path") {
              items.push("Connector/Path");
            } else if (o.type === "rect") {
              items.push("Rectangle");
            } else if (o.type === "circle") {
              items.push("Circle");
            } else if (o.type === "triangle") {
              items.push("Triangle");
            } else if (o.type === "line") {
              items.push("Line");
            } else {
              items.push(o.type ?? "Object");
            }
          }
          return `${objs.length} objects: ${items.join(", ")}`;
        },
      }),
      [emitCount, emitSelection, doDelete, pushHistory]
    );

    return (
      <div
        ref={wrapperRef}
        className="flex-1 relative overflow-auto flex items-center justify-center"
        style={{
          backgroundImage: "radial-gradient(circle, #d4d4d4 0.8px, transparent 0.8px)",
          backgroundSize: "24px 24px",
          backgroundColor: "#f0f0f0",
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/bora-icon")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(e) => {
          const raw = e.dataTransfer.getData("application/bora-icon");
          if (!raw) return;
          e.preventDefault();
          try {
            const icon = JSON.parse(raw);
            if (icon.svg_content) {
              const fc = fcRef.current;
              if (!fc) return;
              const rect = canvasElRef.current?.getBoundingClientRect();
              const scale = zoom / 100;
              const dropX = rect ? (e.clientX - rect.left) / scale : CW / 2;
              const dropY = rect ? (e.clientY - rect.top) / scale : CH / 2;
              const cleanDrop = icon.svg_content.replace(/<\?xml[^?]*\?>\s*/gi, "").replace(/<!DOCTYPE[^>[]*?(\[[^\]]*\])?\s*>\s*/gi, "").replace(/<!--[\s\S]*?-->\s*/g, "").trimStart();
              fabric.loadSVGFromString(cleanDrop, (objects, options) => {
                const group = fabric.util.groupSVGElements(objects, options);
                const s = Math.min(80 / (group.width ?? 80), 80 / (group.height ?? 80));
                group.set({ left: dropX - 40, top: dropY - 40, scaleX: s, scaleY: s });
                fc.add(group);
                fc.setActiveObject(group);
                fc.renderAll();
              });
            }
          } catch {
            // ignore invalid JSON
          }
        }}
      >
        {/* Size indicator above canvas */}
        <div
          className="absolute text-[10px] text-slate/50 font-mono whitespace-nowrap pointer-events-none"
          style={{
            top: `calc(50% - ${(CH * zoom) / 200 + 20}px)`,
          }}
        >
          10 × 7 in
        </div>

        <canvas ref={canvasElRef} />

        {/* AI generation scanning overlay */}
        {isGenerating && (
          <div
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{ overflow: "hidden" }}
          >
            {/* Scanning beam */}
            <div
              className="absolute inset-x-0 h-1"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0) 10%, rgba(59,130,246,0.5) 50%, rgba(59,130,246,0) 90%, transparent 100%)",
                boxShadow: "0 0 30px 10px rgba(59,130,246,0.15), 0 0 60px 20px rgba(59,130,246,0.08)",
                animation: "scanBeam 2.2s ease-in-out infinite",
              }}
            />
            {/* Grid pulse overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "48px 48px",
                animation: "gridPulse 3s ease-in-out infinite",
              }}
            />
            {/* Center status pill */}
            <div
              className="relative bg-white/90 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-2 flex items-center gap-2.5 shadow-lg shadow-blue-100/50"
              style={{ animation: "pillFloat 2.5s ease-in-out infinite" }}
            >
              <div className="relative w-5 h-5">
                <div
                  className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                  style={{ animation: "ringPulse 1.5s ease-in-out infinite" }}
                />
                <div
                  className="absolute inset-0.5 rounded-full border-2 border-transparent border-t-blue-500"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                <div className="absolute inset-[5px] rounded-full bg-blue-500" style={{ animation: "dotPulse 1.5s ease-in-out infinite" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 leading-none">Designing figure</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Placing icons & connections...</p>
              </div>
            </div>

            <style>{`
              @keyframes scanBeam {
                0%, 100% { top: 0%; }
                50% { top: 100%; }
              }
              @keyframes gridPulse {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
              }
              @keyframes pillFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
              @keyframes ringPulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.3); opacity: 0; }
              }
              @keyframes dotPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Floating selection toolbar */}
        {selBounds && (
          <SelectionToolbarPortal
            bounds={selBounds}
            isLocked={isLocked}
            canvasRef={fcRef}
            clipboardRef={clipboardRef}
            onDelete={doDelete}
            pushHistory={pushHistory}
            emitSelection={emitSelection}
          />
        )}
      </div>
    );
  }
);

/* ── Bridge to build toolbar props from canvas state ── */
function SelectionToolbarPortal({
  bounds,
  isLocked,
  canvasRef,
  clipboardRef,
  onDelete,
  pushHistory,
  emitSelection,
}: {
  bounds: { left: number; top: number; width: number; height: number };
  isLocked: boolean;
  canvasRef: React.RefObject<fabric.Canvas | null>;
  clipboardRef: React.MutableRefObject<fabric.Object | null>;
  onDelete: () => void;
  pushHistory: () => void;
  emitSelection: () => void;
}) {
  const fc = canvasRef.current;
  const active = fc?.getActiveObject();

  const doCopy = () => {
    if (!active) return;
    active.clone((cloned: fabric.Object) => { clipboardRef.current = cloned; });
  };

  const doPaste = () => {
    if (!fc || !clipboardRef.current) return;
    clipboardRef.current.clone((cloned: fabric.Object) => {
      fc.discardActiveObject();
      cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
      if (cloned.type === "activeSelection") {
        (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc.add(o));
        cloned.setCoords();
      } else {
        fc.add(cloned);
      }
      clipboardRef.current!.set({ left: (clipboardRef.current!.left ?? 0) + 20, top: (clipboardRef.current!.top ?? 0) + 20 });
      fc.setActiveObject(cloned);
      fc.requestRenderAll();
    });
  };

  const doDuplicate = () => {
    if (!fc || !active) return;
    active.clone((cloned: fabric.Object) => {
      fc.discardActiveObject();
      cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20, evented: true });
      if (cloned.type === "activeSelection") {
        (cloned as fabric.ActiveSelection).forEachObject((o: fabric.Object) => fc.add(o));
        cloned.setCoords();
      } else {
        fc.add(cloned);
      }
      fc.setActiveObject(cloned);
      fc.requestRenderAll();
    });
  };

  const doToggleLock = () => {
    if (!fc || !active) return;
    const locked = active.lockMovementX;
    active.set({
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockRotation: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      hasControls: locked,
      selectable: true,
    });
    fc.renderAll();
  };

  // ── Text info for formatting toolbar ──
  const isTextObj = active && (active.type === "i-text" || active.type === "textbox");
  const textObj = isTextObj ? (active as fabric.IText) : null;
  const textInfo = textObj
    ? {
        fontFamily: textObj.fontFamily ?? "Inter",
        fontSize: textObj.fontSize ?? 16,
        isBold: textObj.fontWeight === "bold",
        isItalic: textObj.fontStyle === "italic",
        isUnderline: !!textObj.underline,
        fill: typeof textObj.fill === "string" ? textObj.fill : "#000000",
        textAlign: textObj.textAlign ?? "left",
      }
    : null;

  const doSetProp = (setter: () => void) => {
    setter();
    fc?.renderAll();
    pushHistory();
    emitSelection();
  };

  return (
    <SelectionToolbar
      bounds={bounds}
      isLocked={isLocked}
      hasClipboard={!!clipboardRef.current}
      textInfo={textInfo}
      onCopy={doCopy}
      onPaste={doPaste}
      onDuplicate={doDuplicate}
      onDelete={onDelete}
      onBringForward={() => { if (fc && active) { fc.bringForward(active); fc.renderAll(); pushHistory(); } }}
      onSendBackward={() => { if (fc && active) { fc.sendBackwards(active); fc.renderAll(); pushHistory(); } }}
      onBringToFront={() => { if (fc && active) { fc.bringToFront(active); fc.renderAll(); pushHistory(); } }}
      onSendToBack={() => { if (fc && active) { fc.sendToBack(active); fc.renderAll(); pushHistory(); } }}
      onToggleLock={doToggleLock}
      onToggleBold={() => { if (textObj) doSetProp(() => textObj.set("fontWeight", textObj.fontWeight === "bold" ? "normal" : "bold")); }}
      onToggleItalic={() => { if (textObj) doSetProp(() => textObj.set("fontStyle", textObj.fontStyle === "italic" ? "normal" : "italic")); }}
      onToggleUnderline={() => { if (textObj) doSetProp(() => textObj.set("underline", !textObj.underline)); }}
      onSetFontSize={(size) => { if (textObj) doSetProp(() => textObj.set("fontSize", size)); }}
      onSetFillColor={(color) => { if (textObj) doSetProp(() => textObj.set("fill", color)); }}
      onSetTextAlign={(align) => { if (textObj) doSetProp(() => textObj.set("textAlign", align)); }}
    />
  );
}

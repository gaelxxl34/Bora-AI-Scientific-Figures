import { useState, useCallback } from "react";
import type { CanvasHandle } from "./EditorCanvas";
import { jsPDF } from "jspdf";

type Format = "png" | "svg" | "pdf";
type DPI = 72 | 150 | 300;

interface ExportModalProps {
  canvasRef: React.RefObject<CanvasHandle | null>;
  title: string;
  onClose: () => void;
}

const FORMAT_META: Record<Format, { label: string; desc: string; icon: JSX.Element }> = {
  png: {
    label: "PNG",
    desc: "Raster image — best for presentations & web",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    ),
  },
  svg: {
    label: "SVG",
    desc: "Vector — scalable, ideal for publications",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
  pdf: {
    label: "PDF",
    desc: "Print-ready document for journals",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H6.75A2.25 2.25 0 0 0 4.5 4.5v15A2.25 2.25 0 0 0 6.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5" />
      </svg>
    ),
  },
};

const DPI_OPTIONS: { value: DPI; label: string }[] = [
  { value: 72, label: "72 DPI — Screen" },
  { value: 150, label: "150 DPI — Presentation" },
  { value: 300, label: "300 DPI — Publication" },
];

// Canvas is 960×672 at 96 DPI  (10×7 inches)
const CANVAS_W = 960;
const CANVAS_H = 672;
const BASE_DPI = 96;

export function ExportModal({ canvasRef, title, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<Format>("png");
  const [dpi, setDpi] = useState<DPI>(300);
  const [exporting, setExporting] = useState(false);

  const fileName = (title || "figure").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "figure";

  const handleExport = useCallback(async () => {
    const handle = canvasRef.current;
    if (!handle) return;
    setExporting(true);

    try {
      if (format === "png") {
        const multiplier = dpi / BASE_DPI;
        const dataUrl = handle.exportPNG(multiplier);
        downloadDataUrl(dataUrl, `${fileName}.png`);
      } else if (format === "svg") {
        const svgString = handle.exportSVG();
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `${fileName}.svg`);
      } else if (format === "pdf") {
        const multiplier = dpi / BASE_DPI;
        const dataUrl = handle.exportPNG(multiplier);
        // Canvas is 10×7 inches landscape
        const widthIn = CANVAS_W / BASE_DPI;
        const heightIn = CANVAS_H / BASE_DPI;
        const pdf = new jsPDF({
          orientation: widthIn > heightIn ? "landscape" : "portrait",
          unit: "in",
          format: [widthIn, heightIn],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, widthIn, heightIn);
        pdf.save(`${fileName}.pdf`);
      }
    } finally {
      setExporting(false);
      onClose();
    }
  }, [canvasRef, format, dpi, fileName, onClose]);

  // Computed dimensions for the selected DPI
  const pxW = Math.round((CANVAS_W / BASE_DPI) * dpi);
  const pxH = Math.round((CANVAS_H / BASE_DPI) * dpi);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-gray">
          <h2 className="text-sm font-semibold text-ink-black">Export Figure</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate hover:text-ink-black rounded hover:bg-lab-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Format selection */}
          <div>
            <label className="text-xs font-medium text-slate block mb-2">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMAT_META) as Format[]).map((f) => {
                const meta = FORMAT_META[f];
                const active = format === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      active
                        ? "border-bora-blue bg-bora-blue-light/50"
                        : "border-border-gray hover:border-slate/40"
                    }`}
                  >
                    <span className={active ? "text-bora-blue" : "text-slate"}>{meta.icon}</span>
                    <span className={`text-xs font-semibold ${active ? "text-bora-blue" : "text-ink-black"}`}>
                      {meta.label}
                    </span>
                    <span className="text-[9px] text-slate leading-tight text-center">{meta.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DPI selection (only for PNG and PDF) */}
          {format !== "svg" && (
            <div>
              <label className="text-xs font-medium text-slate block mb-2">Resolution</label>
              <div className="space-y-1.5">
                {DPI_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      dpi === opt.value
                        ? "border-bora-blue bg-bora-blue-light/30"
                        : "border-border-gray hover:border-slate/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dpi"
                      checked={dpi === opt.value}
                      onChange={() => setDpi(opt.value)}
                      className="accent-bora-blue"
                    />
                    <span className="text-xs text-ink-black">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Output info */}
          <div className="bg-lab-white rounded-lg p-3 text-[11px] text-slate space-y-1">
            <div className="flex justify-between">
              <span>File name</span>
              <span className="font-medium text-ink-black">{fileName}.{format}</span>
            </div>
            {format !== "svg" && (
              <div className="flex justify-between">
                <span>Dimensions</span>
                <span className="font-medium text-ink-black">{pxW} × {pxH} px</span>
              </div>
            )}
            {format === "svg" && (
              <div className="flex justify-between">
                <span>Size</span>
                <span className="font-medium text-ink-black">10 × 7 in (scalable)</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-gray flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate rounded-lg hover:bg-lab-white"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2 text-xs font-semibold bg-bora-blue text-white rounded-lg hover:bg-bora-blue/90 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * canvasCommands.ts — Parses AI-generated ```objects blocks and executes
 * them on the Fabric.js canvas via the CanvasHandle API.
 */
import type { CanvasHandle } from "../components/Editor/EditorCanvas";
import { sanitizeSvg } from "../utils/sanitizeSvg";
import { iconService } from "./iconService";

const AI_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

/** A single canvas command from the AI */
export interface CanvasCommand {
  action: "addIcon" | "addText" | "addShape" | "addConnector";
  // addIcon
  icon?: string;
  // addText
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fill?: string;
  // addShape
  shape?: string;
  width?: number;
  height?: number;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  // addConnector
  arrowhead?: boolean;
  style?: string;   // "activation" | "inhibition" | "binding" | "transport" | "conversion" | "default"
  label?: string;    // optional text label for the connection
  // Positioning
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  scale?: number;
}

/**
 * Extract ```objects JSON blocks from AI text.
 * Returns array of command arrays.
 */
export function parseCommandBlocks(text: string): CanvasCommand[][] {
  const blocks: CanvasCommand[][] = [];
  const regex = /```objects\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        blocks.push(parsed as CanvasCommand[]);
      }
    } catch {
      // Skip malformed blocks
    }
  }
  return blocks;
}

/**
 * Extract ```svg blocks from AI text.
 * Returns array of raw SVG strings.
 */
export function parseSvgBlocks(text: string): string[] {
  const svgs: string[] = [];
  const regex = /```svg\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    // Basic sanity check — must look like SVG
    if (raw.includes("<svg") && raw.includes("</svg>")) {
      svgs.push(raw);
    }
  }
  return svgs;
}

/**
 * Render an SVG string directly onto the Fabric.js canvas.
 * The SVG is loaded as a grouped Fabric object that fills the canvas.
 * Returns a promise resolving to the number of SVG groups added.
 */
export async function executeSvgOnCanvas(
  svgString: string,
  fabricCanvas: fabric.Canvas | null,
): Promise<number> {
  if (!fabricCanvas || !svgString) return 0;
  const fabric = (window as any).fabric;
  if (!fabric) return 0;

  // Clean SVG: remove XML processing instructions and DOCTYPE
  const cleanSvg = svgString
    .replace(/<\?xml[^?]*\?>\s*/gi, "")
    .replace(/<!DOCTYPE[^>[]*?(\[[^\]]*\])?\s*>\s*/gi, "")
    .replace(/<!--[\s\S]*?-->\s*/g, "")
    .trimStart();

  return new Promise<number>((resolve) => {
    fabric.loadSVGFromString(cleanSvg, (objects: any[], options: any) => {
      if (!objects || objects.length === 0) {
        resolve(0);
        return;
      }

      // Clear the canvas before adding the new figure
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";

      const group = fabric.util.groupSVGElements(objects, options);

      // Scale to fit the canvas (960 x 672)
      const canvasW = fabricCanvas.getWidth();
      const canvasH = fabricCanvas.getHeight();
      const groupW = group.width ?? canvasW;
      const groupH = group.height ?? canvasH;
      const scale = Math.min(canvasW / groupW, canvasH / groupH, 1);

      // Center the SVG group on canvas
      group.set({
        left: (canvasW - groupW * scale) / 2,
        top: (canvasH - groupH * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });

      fabricCanvas.add(group);
      fabricCanvas.renderAll();
      resolve(objects.length);
    });
  });
}

/**
 * Synonym map: maps common AI-generated terms to actual icon names in the library.
 * This bridges the gap between what the AI says and what the library has.
 */
const ICON_SYNONYMS: Record<string, string[]> = {
  // Materials & Structures
  scaffold: ["collagen", "Proteoglycan", "fiber", "extracellular matrix"],
  biomaterial: ["collagen", "Proteoglycan", "polymer"],
  hydrogel: ["collagen", "gel"],
  polymer: ["actin", "fiber", "collagen"],
  matrix: ["Proteoglycan", "collagen", "extracellular matrix"],
  fiber: ["collagen", "actin", "fibrin"],
  mesh: ["collagen", "Proteoglycan"],
  // Signaling
  signal: ["cytokine", "growth factor", "receptor"],
  signaling: ["receptor", "kinase", "cytokine"],
  pathway: ["kinase", "receptor"],
  cascade: ["kinase", "proteasome"],
  // Cells
  "stem cell": ["hematopoetic stem cell", "stem cell", "cell"],
  "stem cells": ["hematopoetic stem cell", "stem cell", "cell"],
  progenitor: ["stem cell", "cell"],
  differentiation: ["cell", "stem cell"],
  proliferation: ["cell", "mitotic"],
  // Molecules
  enzyme: ["proteasome", "kinase"],
  drug: ["aspirin", "syringe"],
  molecule: ["atom", "compound"],
  chemical: ["beaker", "flask", "atom"],
  protein: ["Protein monochrome", "kinase"],
  gene: ["dna", "chromosome"],
  mrna: ["rna", "adenylated mrna"],
  // Processes
  apoptosis: ["apoptosis", "apoptotic cell"],
  inflammation: ["cytokine", "macrophage"],
  immune: ["antibody", "t cell", "macrophage"],
  infection: ["virus", "bacteria"],
  "gene expression": ["dna", "transcription"],
  transcription: ["transcription factor rna", "dna"],
  translation: ["ribosome", "rna"],
  secretion: ["vesicle", "exosome"],
  endocytosis: ["vesicle", "cell membrane"],
  transport: ["vesicle", "transporter"],
  metabolism: ["mitochondria", "atp"],
  // Lab
  experiment: ["flask", "beaker", "pipette"],
  injection: ["syringe", "needle"],
  analysis: ["microscope", "gel"],
  sample: ["flask", "beaker"],
  culture: ["well plate", "cell culture"],
  // Tissues & Organs
  tissue: ["cell", "collagen", "Tissues"],
  organ: ["liver", "kidney", "heart"],
  blood: ["blood vessel", "platelet"],
  vasculature: ["blood vessel", "angiogenesis"],
  "blood vessel": ["blood vessel 1", "angiogenesis"],
  tumor: ["cancerous cell", "tumor", "angiogenesis"],
  cancer: ["cancerous cell", "tumor", "breast cancer"],
  // Nano
  nanoparticle: ["Nanoparticle", "nanoparticle"],
  liposome: ["liposome", "vesicle"],
  delivery: ["vesicle", "nanoparticle"],
  // Equipment
  microscope: ["microscope", "asb microscope"],
  sequencing: ["DNA sequencer", "sequencing"],
  centrifuge: ["centrifuge"],
  plate: ["well plate", "24 well plate", "96 well"],
};

/**
 * Search the icon library using the client-side manifest (no backend needed).
 * Uses ranked matching with synonym expansion and multi-word fallback.
 */
async function searchIcon(query: string): Promise<string | null> {
  try {
    const q = query.toLowerCase().trim();

    // 1. Try the full query first
    const result = await iconService.searchIcons(query, { limit: 20 });
    if (result.icons.length > 0) {
      const best = pickBest(result.icons, query);
      if (best) return best;
    }

    // 2. Try synonym expansions
    for (const [key, synonyms] of Object.entries(ICON_SYNONYMS)) {
      if (q === key || q.includes(key) || key.includes(q)) {
        for (const syn of synonyms) {
          const synResult = await iconService.searchIcons(syn, { limit: 10 });
          if (synResult.icons.length > 0) {
            const best = pickBest(synResult.icons, syn);
            if (best) return best;
          }
        }
      }
    }

    // 3. Try each individual word (longest first, skip very short words)
    const words = query.split(/\s+/).filter((w) => w.length > 2).sort((a, b) => b.length - a.length);
    for (const word of words) {
      const fallback = await iconService.searchIcons(word, { limit: 10 });
      if (fallback.icons.length > 0) {
        const url = pickBest(fallback.icons, query);
        if (url) return url;
      }
    }
  } catch {
    // Fall through
  }
  return null;
}

/** Pick the best icon from results by name similarity to query */
function pickBest(icons: Array<{ name: string; svg_url?: string | null }>, query: string): string | null {
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/);
  const ranked = icons
    .filter((ic) => ic.svg_url)
    .map((ic) => {
      const name = ic.name.toLowerCase();
      let score = 0;
      // Exact match
      if (name === q) score = 100;
      // Name starts with query
      else if (name.startsWith(q)) score = 80;
      // Name contains full query
      else if (name.includes(q)) score = 60;
      // Query contains name (e.g., searching "growth factor receptor" matches "receptor")
      else if (q.includes(name)) score = 40;
      // Check word overlap
      else {
        const nameWords = name.split(/\s+/);
        const overlap = qWords.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw))).length;
        score = overlap * 15;
      }
      // Boost shorter names (more specific/cleaner icons)
      if (name.length < 20) score += 5;
      return { url: ic.svg_url!, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.length > 0 ? ranked[0].url : null;
}

/**
 * Fetch an SVG file content from its path.
 */
async function fetchSvgContent(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const raw = await res.text();
    return sanitizeSvg(raw);
  } catch {
    return null;
  }
}

/**
 * Generate an SVG icon via AI when it doesn't exist in the library,
 * then save it to the library so future searches find it.
 */
async function generateAndSaveIcon(iconName: string): Promise<string | null> {
  try {
    // 1. Ask AI to generate the icon SVG
    const genRes = await fetch(`${AI_API_BASE}/ai/generate-icon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: iconName }),
    });
    if (!genRes.ok) return null;
    const { svg } = await genRes.json();
    if (!svg) return null;

    // 2. Save it to the local library (fire-and-forget — don't block rendering)
    fetch(`${AI_API_BASE}/ai/save-icon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: iconName, svg }),
    }).catch(() => {});

    return sanitizeSvg(svg);
  } catch {
    return null;
  }
}

/**
 * Execute a batch of canvas commands. Handles icon search + fetch asynchronously.
 * Returns the number of objects successfully added.
 */
export async function executeCommands(
  commands: CanvasCommand[],
  _canvasHandle: CanvasHandle,
  fabricCanvas: fabric.Canvas | null,
): Promise<number> {
  // Clear the canvas before rendering a new figure
  if (fabricCanvas) {
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
  }

  let added = 0;

  for (const cmd of commands) {
    try {
      switch (cmd.action) {
        case "addIcon": {
          if (!cmd.icon || !fabricCanvas) break;
          const fabric = (window as any).fabric;
          if (!fabric) break;

          const x = cmd.x ?? 480;
          const y = cmd.y ?? 336;
          const targetScale = cmd.scale ?? 80;

          const iconPath = await searchIcon(cmd.icon);
          const svg = iconPath ? await fetchSvgContent(iconPath) : null;

          if (svg) {
            // Render the real SVG icon
            await new Promise<void>((resolve) => {
              fabric.loadSVGFromString(svg, (objects: any[], options: any) => {
                if (!objects || objects.length === 0) {
                  resolve();
                  return;
                }
                const group = fabric.util.groupSVGElements(objects, options);
                const gw = group.width ?? targetScale;
                const gh = group.height ?? targetScale;
                // Constrain BOTH width and height to target scale
                const s = Math.min(targetScale / gw, targetScale / gh);
                group.set({
                  left: x,
                  top: y,
                  scaleX: s,
                  scaleY: s,
                  originX: "center",
                  originY: "center",
                });
                group.name = cmd.icon;
                fabricCanvas.add(group);
                fabricCanvas.renderAll();
                resolve();
              });
            });
          } else {
            // Icon not in library — generate via AI and save to library
            const generatedSvg = await generateAndSaveIcon(cmd.icon);
            if (generatedSvg) {
              await new Promise<void>((resolve) => {
                fabric.loadSVGFromString(generatedSvg, (objects: any[], options: any) => {
                  if (!objects || objects.length === 0) {
                    resolve();
                    return;
                  }
                  const group = fabric.util.groupSVGElements(objects, options);
                  const gw = group.width ?? targetScale;
                  const gh = group.height ?? targetScale;
                  const s = Math.min(targetScale / gw, targetScale / gh);
                  group.set({
                    left: x,
                    top: y,
                    scaleX: s,
                    scaleY: s,
                    originX: "center",
                    originY: "center",
                  });
                  group.name = cmd.icon;
                  fabricCanvas.add(group);
                  fabricCanvas.renderAll();
                  resolve();
                });
              });
            } else {
              // Last resort fallback: styled circle with label (looks cleaner than rectangles)
              const r = Math.max(targetScale * 0.5, 28);
              const circle = new fabric.Circle({
                radius: r,
                fill: "#f0f4ff",
                stroke: "#94b8db",
                strokeWidth: 1.5,
                originX: "center",
                originY: "center",
              });
              const shortLabel = cmd.icon.length > 14 ? cmd.icon.slice(0, 12) + "…" : cmd.icon;
              const iconLabel = new fabric.Text(shortLabel, {
                fontSize: Math.min(11, r * 0.35),
                fontFamily: "Inter, Arial, sans-serif",
                fontWeight: "500",
                fill: "#3a5a7c",
                textAlign: "center",
                originX: "center",
                originY: "center",
              });
              const group = new fabric.Group([circle, iconLabel], {
                left: x,
                top: y,
                originX: "center",
                originY: "center",
              });
              group.name = cmd.icon;
              fabricCanvas.add(group);
              fabricCanvas.renderAll();
            }
          }
          added++;
          break;
        }

        case "addText": {
          if (!cmd.text || !fabricCanvas) break;
          const fabric = (window as any).fabric;
          if (!fabric) break;

          const textObj = new fabric.IText(cmd.text, {
            left: cmd.x ?? 480,
            top: cmd.y ?? 336,
            fontSize: cmd.fontSize ?? 14,
            fontWeight: cmd.fontWeight ?? "normal",
            fontFamily: cmd.fontFamily ?? "Inter",
            fill: cmd.fill ?? "#0f1117",
            originX: "center",
            originY: "top",
          });
          fabricCanvas.add(textObj);
          fabricCanvas.renderAll();
          added++;
          break;
        }

        case "addConnector": {
          if (!fabricCanvas) break;
          const fabric = (window as any).fabric;
          if (!fabric) break;

          const x1 = cmd.x1 ?? 100;
          const y1 = cmd.y1 ?? 336;
          const x2 = cmd.x2 ?? 300;
          const y2 = cmd.y2 ?? 336;
          const connStyle = cmd.style ?? "default";
          const sw = cmd.strokeWidth ?? 2.5;

          // Semantic style definitions
          const styleMap: Record<string, { color: string; dash?: number[] }> = {
            activation:  { color: "#2d6a4f" },
            inhibition:  { color: "#c1121f" },
            binding:     { color: "#6930c3", dash: [7, 4] },
            transport:   { color: "#0077b6" },
            conversion:  { color: "#e76f51" },
            default:     { color: "#4a5568" },
          };
          const sdef = styleMap[connStyle] || styleMap["default"];
          const strokeColor = cmd.stroke ?? sdef.color;

          // Build a path — straight lines for horizontal/vertical, subtle curve otherwise
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Only curve when the line is diagonal; keep straight for axis-aligned connections
          const isAxisAligned = Math.abs(dx) < 15 || Math.abs(dy) < 15;
          const curveOffset = isAxisAligned ? 0 : Math.min(dist * 0.1, 25);
          const nx = -dy / (dist || 1);
          const ny = dx / (dist || 1);
          const cx1 = x1 + dx * 0.33 + nx * curveOffset;
          const cy1 = y1 + dy * 0.33 + ny * curveOffset;
          const cx2 = x1 + dx * 0.66 + nx * curveOffset;
          const cy2 = y1 + dy * 0.66 + ny * curveOffset;

          let pathStr: string;
          if (curveOffset === 0) {
            pathStr = `M ${x1} ${y1} L ${x2} ${y2}`;
          } else {
            pathStr = `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`;
          }
          const pathObj = new fabric.Path(pathStr, {
            fill: "",
            stroke: strokeColor,
            strokeWidth: sw,
            strokeLineCap: "round",
            strokeDashArray: sdef.dash ?? undefined,
            selectable: true,
          });

          const groupItems: any[] = [pathObj];

          // Calculate arrowhead angle from the last segment direction
          const endTanX = curveOffset === 0 ? dx : x2 - cx2;
          const endTanY = curveOffset === 0 ? dy : y2 - cy2;
          const angle = Math.atan2(endTanY, endTanX);
          const angleDeg = angle * (180 / Math.PI);

          if (cmd.arrowhead !== false) {
            if (connStyle === "inhibition") {
              // T-bar marker: a perpendicular line at the end
              const barLen = Math.max(12, sw * 5);
              const perpX = Math.cos(angle + Math.PI / 2) * barLen / 2;
              const perpY = Math.sin(angle + Math.PI / 2) * barLen / 2;
              const tbar = new fabric.Line(
                [x2 - perpX, y2 - perpY, x2 + perpX, y2 + perpY],
                { stroke: strokeColor, strokeWidth: sw + 1, strokeLineCap: "round" },
              );
              groupItems.push(tbar);
            } else if (connStyle === "binding") {
              // Open diamond marker
              const dSize = 8;
              const diamondPath = new fabric.Path(
                `M ${x2} ${y2} ` +
                `L ${x2 - dSize * Math.cos(angle) + dSize * 0.5 * Math.cos(angle + Math.PI / 2)} ${y2 - dSize * Math.sin(angle) + dSize * 0.5 * Math.sin(angle + Math.PI / 2)} ` +
                `L ${x2 - 2 * dSize * Math.cos(angle)} ${y2 - 2 * dSize * Math.sin(angle)} ` +
                `L ${x2 - dSize * Math.cos(angle) - dSize * 0.5 * Math.cos(angle + Math.PI / 2)} ${y2 - dSize * Math.sin(angle) - dSize * 0.5 * Math.sin(angle + Math.PI / 2)} Z`,
                { fill: "", stroke: strokeColor, strokeWidth: 1.5 },
              );
              groupItems.push(diamondPath);
            } else if (connStyle === "transport") {
              // Double chevron >>
              const chevSize = 7;
              for (let i = 0; i < 2; i++) {
                const offset = i * 6;
                const bx = x2 - (offset + chevSize) * Math.cos(angle);
                const by = y2 - (offset + chevSize) * Math.sin(angle);
                const tx = bx + chevSize * Math.cos(angle);
                const ty = by + chevSize * Math.sin(angle);
                const chev = new fabric.Path(
                  `M ${bx + chevSize * 0.6 * Math.cos(angle + Math.PI / 2)} ${by + chevSize * 0.6 * Math.sin(angle + Math.PI / 2)} ` +
                  `L ${tx} ${ty} ` +
                  `L ${bx - chevSize * 0.6 * Math.cos(angle + Math.PI / 2)} ${by - chevSize * 0.6 * Math.sin(angle + Math.PI / 2)}`,
                  { fill: "", stroke: strokeColor, strokeWidth: sw, strokeLineCap: "round", strokeLineJoin: "round" },
                );
                groupItems.push(chev);
              }
            } else {
              // Default filled arrow (activation, conversion, default)
              const headSize = Math.max(10, sw * 4);
              const head = new fabric.Triangle({
                left: x2,
                top: y2,
                width: headSize,
                height: headSize,
                fill: strokeColor,
                angle: angleDeg + 90,
                originX: "center",
                originY: "center",
              });
              groupItems.push(head);
            }
          }

          // Add optional label on the connection
          if (cmd.label) {
            const midX = (x1 + x2) / 2 + nx * (curveOffset * 0.5 + 8);
            const midY = (y1 + y2) / 2 + ny * (curveOffset * 0.5 + 8);
            const labelText = new fabric.Text(cmd.label, {
              left: midX,
              top: midY,
              fontSize: 10,
              fontFamily: "Inter",
              fill: strokeColor,
              fontStyle: "italic",
              originX: "center",
              originY: "center",
            });
            // White background behind label
            const labelBg = new fabric.Rect({
              left: midX,
              top: midY,
              width: labelText.width! + 6,
              height: 14,
              fill: "#ffffff",
              opacity: 0.9,
              rx: 3,
              ry: 3,
              originX: "center",
              originY: "center",
            });
            groupItems.push(labelBg, labelText);
          }

          const group = new fabric.Group(groupItems);
          fabricCanvas.add(group);
          fabricCanvas.renderAll();
          added++;
          break;
        }

        case "addShape": {
          if (!cmd.shape || !fabricCanvas) break;
          const fabric = (window as any).fabric;
          if (!fabric) break;

          const cx = cmd.x ?? 480;
          const cy = cmd.y ?? 336;
          let obj: any = null;

          switch (cmd.shape) {
            case "Rectangle":
              obj = new fabric.Rect({
                left: cx,
                top: cy,
                width: cmd.width ?? 120,
                height: cmd.height ?? 80,
                fill: cmd.fill ?? "transparent",
                stroke: cmd.stroke ?? "#0f1117",
                strokeWidth: cmd.strokeWidth ?? 1,
                rx: cmd.rx ?? 4,
                ry: cmd.rx ?? 4,
              });
              break;
            case "Circle":
              obj = new fabric.Circle({
                left: cx,
                top: cy,
                radius: cmd.radius ?? 40,
                fill: cmd.fill ?? "transparent",
                stroke: cmd.stroke ?? "#0f1117",
                strokeWidth: cmd.strokeWidth ?? 2,
              });
              break;
            case "Triangle":
              obj = new fabric.Triangle({
                left: cx,
                top: cy,
                width: cmd.width ?? 80,
                height: cmd.height ?? 80,
                fill: cmd.fill ?? "transparent",
                stroke: cmd.stroke ?? "#0f1117",
                strokeWidth: cmd.strokeWidth ?? 2,
              });
              break;
            case "Line": {
              const x1 = cmd.x1 ?? cx - 60;
              const y1 = cmd.y1 ?? cy;
              const x2 = cmd.x2 ?? cx + 60;
              const y2 = cmd.y2 ?? cy;
              obj = new fabric.Line([x1, y1, x2, y2], {
                stroke: cmd.stroke ?? "#0f1117",
                strokeWidth: cmd.strokeWidth ?? 2,
              });
              break;
            }
            case "Arrow": {
              // Legacy Arrow shape — use addConnector instead
              const ax1 = cmd.x1 ?? cx;
              const ay1 = cmd.y1 ?? cy;
              const ax2 = cmd.x2 ?? cx + 120;
              const ay2 = cmd.y2 ?? cy;
              const aStroke = cmd.stroke ?? "#0f1117";
              const aSw = cmd.strokeWidth ?? 2;
              const aLine = new fabric.Line([ax1, ay1, ax2, ay2], {
                stroke: aStroke,
                strokeWidth: aSw,
              });
              const aAngle = Math.atan2(ay2 - ay1, ax2 - ax1) * (180 / Math.PI);
              const aHead = new fabric.Triangle({
                left: ax2,
                top: ay2,
                width: 12,
                height: 12,
                fill: aStroke,
                angle: aAngle + 90,
                originX: "center",
                originY: "center",
              });
              obj = new fabric.Group([aLine, aHead]);
              break;
            }
            case "Bracket":
              obj = new fabric.Path(
                `M ${cx - 30} ${cy - 40} Q ${cx - 50} ${cy - 40} ${cx - 50} ${cy} Q ${cx - 50} ${cy + 40} ${cx - 30} ${cy + 40}`,
                { fill: "transparent", stroke: cmd.stroke ?? "#0f1117", strokeWidth: cmd.strokeWidth ?? 2 },
              );
              break;
          }

          if (obj) {
            fabricCanvas.add(obj);
            fabricCanvas.renderAll();
            added++;
          }
          break;
        }
      }
    } catch (e) {
      console.warn("Command execution failed:", cmd, e);
    }
  }

  return added;
}

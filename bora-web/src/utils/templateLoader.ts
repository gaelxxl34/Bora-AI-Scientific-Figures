/**
 * Template loader: takes a Template definition and builds the Fabric.js canvas
 * by fetching icon SVGs, placing shapes, added text elements, etc.
 */
import { fabric } from "fabric";
import { sanitizeSvg } from "./sanitizeSvg";
import type { Template } from "../data/templates";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ananejrhkkmkkyupnwye.supabase.co';

/** Resolve local /icons/ paths to Supabase Storage URLs */
function resolveIconPath(path: string): string {
  if (path.startsWith('/icons/')) {
    return `${SUPABASE_URL}/storage/v1/object/public${path}`;
  }
  return path;
}

/**
 * Load a template onto a Fabric.js canvas.
 * Returns the serialised canvas JSON after all elements are placed.
 */
export async function loadTemplateOntoCanvas(
  fc: fabric.Canvas,
  template: Template,
): Promise<void> {
  // Clear canvas first
  fc.clear();
  fc.backgroundColor = "#ffffff";

  // 1. Add shape elements (backgrounds, compartments)
  for (const shape of template.shapeElements) {
    let obj: fabric.Object | null = null;
    if (shape.type === "rect") {
      obj = new fabric.Rect({
        left: shape.left,
        top: shape.top,
        width: shape.width ?? 100,
        height: shape.height ?? 100,
        fill: shape.fill,
        stroke: shape.stroke ?? "",
        strokeWidth: shape.strokeWidth ?? 0,
        rx: shape.rx ?? 0,
        ry: shape.ry ?? 0,
        opacity: shape.opacity ?? 1,
        selectable: true,
      });
    } else if (shape.type === "circle") {
      obj = new fabric.Circle({
        left: shape.left,
        top: shape.top,
        radius: shape.radius ?? 30,
        fill: shape.fill,
        stroke: shape.stroke ?? "",
        strokeWidth: shape.strokeWidth ?? 0,
        opacity: shape.opacity ?? 1,
        selectable: true,
      });
    }
    if (obj) fc.add(obj);
  }

  // 2. Add text elements
  for (const txt of template.textElements) {
    const tb = new fabric.Textbox(txt.text, {
      left: txt.left,
      top: txt.top,
      width: txt.width,
      fontSize: txt.fontSize,
      fontFamily: txt.fontFamily,
      fontWeight: (txt.fontWeight ?? "normal") as string,
      fontStyle: (txt.fontStyle ?? "normal") as "" | "normal" | "italic" | "oblique",
      fill: txt.fill,
      textAlign: txt.textAlign ?? "left",
      opacity: txt.opacity ?? 1,
      selectable: true,
    });
    fc.add(tb);
  }

  // 3. Fetch and place icons (parallel fetch, sequential add)
  const iconResults = await Promise.all(
    template.iconElements.map(async (icon) => {
      try {
        const resp = await fetch(resolveIconPath(icon.iconPath));
        if (!resp.ok) return null;
        const raw = await resp.text();
        return { icon, svg: sanitizeSvg(raw) };
      } catch {
        return null;
      }
    }),
  );

  for (const result of iconResults) {
    if (!result) continue;
    const { icon, svg } = result;
    await new Promise<void>((resolve) => {
      fabric.loadSVGFromString(svg, (objects, options) => {
        const group = fabric.util.groupSVGElements(objects, options);
        const targetWidth = icon.scale;
        const s = targetWidth / (group.width ?? targetWidth);
        group.set({
          left: icon.left,
          top: icon.top,
          scaleX: s,
          scaleY: s,
        });
        (group as any).name = icon.name;
        fc.add(group);
        resolve();
      });
    });
  }

  fc.renderAll();
}

// fabricHelpers: Fabric.js object factory functions
// TODO: Create Fabric objects from SVG elements
// TODO: Load full SVG group from URL (for icon drag-and-drop)
// TODO: Serialize/deserialize canvas state

export function loadSvgFromUrl(
  _url: string,
  _canvas: fabric.Canvas
): Promise<void> {
  // TODO: fabric.loadSVGFromURL → add objects to canvas
  return Promise.resolve();
}

export function loadSvgFromString(
  _svgString: string,
  _canvas: fabric.Canvas
): Promise<void> {
  // TODO: fabric.loadSVGFromString → add objects to canvas
  return Promise.resolve();
}

export function serializeCanvas(_canvas: fabric.Canvas): string {
  // TODO: Return JSON.stringify(canvas.toJSON())
  return "{}";
}

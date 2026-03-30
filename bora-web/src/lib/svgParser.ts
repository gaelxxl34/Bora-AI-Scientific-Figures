// svgParser: Parse Claude's SVG output from streaming text
// TODO: Detect complete SVG elements from partial text stream
// TODO: Return parsed SVG DOM nodes for Fabric.js injection

export function parseSvgStream(accumulated: string): {
  completeElements: string[];
  remainder: string;
} {
  // TODO: Implement SVG element detection (find closing tags)
  return {
    completeElements: [],
    remainder: accumulated,
  };
}

export function parseSvgString(svgString: string): SVGElement | null {
  // TODO: Parse complete SVG string into DOM element
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) return null;
  return doc.documentElement as unknown as SVGElement;
}

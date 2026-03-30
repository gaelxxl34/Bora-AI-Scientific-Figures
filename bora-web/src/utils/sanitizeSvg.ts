/**
 * Sanitize raw SVG text for safe inline rendering.
 * Strips XML declarations, DOCTYPE/DTD blocks, and HTML comments
 * that cause browsers to render stray text like `]>`.
 */
export function sanitizeSvg(raw: string): string {
  let s = raw;
  // Remove XML processing instructions: <?xml ... ?>
  s = s.replace(/<\?xml[^?]*\?>\s*/gi, "");
  // Remove DOCTYPE (with optional internal subset between [ ... ])
  s = s.replace(/<!DOCTYPE[^>[]*(\[[^\]]*\])?\s*>\s*/gi, "");
  // Remove HTML/XML comments
  s = s.replace(/<!--[\s\S]*?-->\s*/g, "");
  // Trim leading whitespace before <svg
  s = s.replace(/^\s+/, "");
  return s;
}

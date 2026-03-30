// iconEmbedder: Inject external SVG icons into Fabric canvas
// TODO: Fetch SVG from R2 CDN URL
// TODO: Parse SVG and add as a Fabric group
// TODO: Position at drop location or center of canvas

export async function embedIcon(
  _iconUrl: string,
  _canvas: fabric.Canvas,
  _position?: { x: number; y: number }
): Promise<void> {
  // TODO: Fetch SVG → loadSvgFromString → position on canvas
}

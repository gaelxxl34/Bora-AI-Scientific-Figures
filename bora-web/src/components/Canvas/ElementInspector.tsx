// ElementInspector: Right panel showing selected element properties
// TODO: Show fill, stroke, position, size, opacity for selected Fabric object
// TODO: Wire property changes back to canvas

export function ElementInspector() {
  // TODO: Read selected object from canvasStore
  const hasSelection = false;

  if (!hasSelection) return null;

  return (
    <div className="absolute top-4 right-4 z-10 w-56 bg-white rounded-lg shadow-sm border border-border-gray p-4">
      <h3 className="text-sm font-semibold mb-3">Properties</h3>
      {/* TODO: Property fields for selected element */}
      <p className="text-xs text-slate">Select an element to inspect</p>
    </div>
  );
}

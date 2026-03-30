// CanvasToolbar: Select, zoom, pan, delete tools
// TODO: Implement tool selection state
// TODO: Wire to Fabric.js canvas mode (select, pan, draw)

export function CanvasToolbar() {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white rounded-lg shadow-sm border border-border-gray p-2">
      <button className="p-2 hover:bg-bora-blue-light rounded" title="Select">
        {/* TODO: Select icon */}S
      </button>
      <button className="p-2 hover:bg-bora-blue-light rounded" title="Pan">
        {/* TODO: Pan icon */}P
      </button>
      <button className="p-2 hover:bg-bora-blue-light rounded" title="Zoom">
        {/* TODO: Zoom icon */}Z
      </button>
      <button className="p-2 hover:bg-bora-blue-light rounded text-red-500" title="Delete">
        {/* TODO: Delete icon */}D
      </button>
    </div>
  );
}

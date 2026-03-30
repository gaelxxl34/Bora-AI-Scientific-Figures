// CanvasControls: Zoom slider, fit-to-screen button
// TODO: Connect zoom state to canvasStore
// TODO: Implement fit-to-screen logic

export function CanvasControls() {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-border-gray p-2">
      <button className="text-xs px-2 py-1 hover:bg-bora-blue-light rounded">
        Fit
      </button>
      <input type="range" min={10} max={400} defaultValue={100} className="w-24" />
      <span className="text-xs text-slate w-10 text-center">100%</span>
    </div>
  );
}

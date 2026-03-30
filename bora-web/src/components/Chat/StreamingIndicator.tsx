// StreamingIndicator: Typing animation shown during SSE streaming
// TODO: Animate dots or show partial SVG progress

export function StreamingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-bora-blue-light rounded-lg px-3 py-2 text-sm text-slate">
        <span className="animate-pulse">Generating figure...</span>
      </div>
    </div>
  );
}

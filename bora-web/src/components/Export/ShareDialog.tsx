// ShareDialog: Public link sharing + copy options
// TODO: Generate shareable link via API
// TODO: Copy-to-clipboard functionality

export function ShareDialog() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate">Share</h3>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value="https://bora.ai/figure/..."
          className="flex-1 rounded border border-border-gray px-2 py-1.5 text-xs text-slate bg-lab-white"
        />
        <button className="text-xs bg-bora-blue-light text-bora-blue px-3 py-1.5 rounded hover:bg-bora-blue hover:text-white">
          Copy
        </button>
      </div>
    </div>
  );
}

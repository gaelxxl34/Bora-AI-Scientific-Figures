// ExportOptions: Resolution, format, size selection
// TODO: Wire format/resolution to export API call
// TODO: Show preview of export dimensions

export function ExportOptions() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate block mb-1">Format</label>
        <select className="w-full rounded border border-border-gray px-2 py-1.5 text-sm">
          <option value="svg">SVG (vector)</option>
          <option value="png">PNG (raster)</option>
          <option value="pdf">PDF (print)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate block mb-1">Resolution</label>
        <select className="w-full rounded border border-border-gray px-2 py-1.5 text-sm">
          <option value="72">72 DPI (screen)</option>
          <option value="150">150 DPI (presentation)</option>
          <option value="300">300 DPI (publication)</option>
        </select>
      </div>
      <button className="w-full bg-bora-blue text-white py-2 rounded-lg text-sm font-medium hover:bg-bora-blue/90">
        Export
      </button>
    </div>
  );
}

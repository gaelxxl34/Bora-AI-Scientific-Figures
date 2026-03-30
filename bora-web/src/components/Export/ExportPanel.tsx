import { ExportOptions } from "./ExportOptions";
import { ShareDialog } from "./ShareDialog";

// ExportPanel: SVG / PNG / PDF export UI
// TODO: Show when user clicks Export button
// TODO: Wire to exportService

export function ExportPanel() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-semibold">Export Figure</h2>
      <ExportOptions />
      <hr className="border-border-gray" />
      <ShareDialog />
    </div>
  );
}

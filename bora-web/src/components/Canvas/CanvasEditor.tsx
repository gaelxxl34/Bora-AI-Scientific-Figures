import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasControls } from "./CanvasControls";
import { ElementInspector } from "./ElementInspector";

// CanvasEditor: Main Fabric.js canvas component
// TODO: Initialize Fabric.js canvas via useFabricCanvas hook
// TODO: Render AI-generated SVG via useSvgRenderer hook
// TODO: Support undo/redo via useUndoRedo hook

export function CanvasEditor() {
  return (
    <div className="relative w-full h-full bg-lab-white">
      <CanvasToolbar />
      <div className="flex-1 flex items-center justify-center">
        <canvas id="bora-canvas" className="border border-border-gray" />
        {/* TODO: Fabric.js will attach to this canvas element */}
      </div>
      <CanvasControls />
      <ElementInspector />
    </div>
  );
}

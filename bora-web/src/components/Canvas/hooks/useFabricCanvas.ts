// useFabricCanvas: Initialize Fabric.js canvas and bind events
// TODO: Create fabric.Canvas instance on mount
// TODO: Bind object:selected, object:modified, mouse events
// TODO: Handle cleanup on unmount

import { useEffect, useRef } from "react";

export function useFabricCanvas(canvasId: string) {
  const canvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    // TODO: Initialize Fabric.js
    // canvasRef.current = new fabric.Canvas(canvasId, { ... });
    return () => {
      // TODO: Dispose canvas
    };
  }, [canvasId]);

  return canvasRef;
}

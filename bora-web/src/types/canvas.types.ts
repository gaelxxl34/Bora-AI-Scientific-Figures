// canvas.types.ts: TypeScript types for canvas state

export interface CanvasObject {
  id: string;
  type: "path" | "rect" | "circle" | "text" | "group" | "image";
  left: number;
  top: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface CanvasState {
  objects: CanvasObject[];
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

export interface CanvasHistoryEntry {
  timestamp: number;
  serializedState: string;
}

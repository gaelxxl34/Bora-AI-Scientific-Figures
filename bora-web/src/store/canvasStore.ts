// canvasStore: Zustand store for Fabric.js canvas state
// TODO: Track Fabric objects, selection, zoom level
// TODO: Persist to localStorage for auto-save

import { create } from "zustand";

interface CanvasState {
  zoom: number;
  selectedObjectId: string | null;
  objects: unknown[]; // TODO: Type as Fabric.js objects
  setZoom: (zoom: number) => void;
  setSelectedObject: (id: string | null) => void;
  setObjects: (objects: unknown[]) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoom: 100,
  selectedObjectId: null,
  objects: [],
  setZoom: (zoom) => set({ zoom }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setObjects: (objects) => set({ objects }),
}));

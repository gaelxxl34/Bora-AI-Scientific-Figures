// useKeyboardShortcuts: Global keyboard shortcut handler
// TODO: Cmd+Z undo, Cmd+Shift+Z redo
// TODO: Cmd+S save, Delete remove selected, Cmd+E export

import { useEffect } from "react";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        // TODO: Trigger undo
      }
      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        // TODO: Trigger redo
      }
      if (isMeta && e.key === "s") {
        e.preventDefault();
        // TODO: Trigger save
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        // TODO: Delete selected canvas object
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

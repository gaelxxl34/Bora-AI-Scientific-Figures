// useAutoSave: Debounced canvas auto-save
// TODO: Watch canvas changes and save to backend after debounce
// TODO: Show saving indicator via projectStore

import { useEffect, useRef } from "react";

export function useAutoSave(
  _canvasState: string,
  _saveFn: (state: string) => Promise<void>,
  _debounceMs = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // TODO: Debounce save on canvas state change
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [_canvasState, _saveFn, _debounceMs]);
}

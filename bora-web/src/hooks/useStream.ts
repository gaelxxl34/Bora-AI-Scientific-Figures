// useStream: SSE subscription hook
// TODO: Manage SSE connection lifecycle
// TODO: Accumulate tokens and trigger canvas rendering

import { useCallback, useRef } from "react";

export function useStream() {
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    (_prompt: string, _onChunk: (chunk: string) => void) => {
      // TODO: Create AbortController, start streamService, handle cleanup
      abortRef.current = new AbortController();
    },
    []
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startStream, stopStream };
}

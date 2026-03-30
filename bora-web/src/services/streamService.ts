// streamService: SSE client for AI streaming
// TODO: Open SSE connection to POST /generate
// TODO: Parse streaming chunks and emit events
// TODO: Handle connection errors, retry, and completion

export const streamService = {
  async generateFigure(
    prompt: string,
    figureId: string,
    canvasState: string | null,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, figure_id: figureId, canvas_state: canvasState }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // TODO: Read SSE stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        onChunk(text);
      }

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },
};

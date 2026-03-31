// aiService.ts — Frontend client for the Bora AI chat endpoint
// Handles SSE streaming from /api/ai/chat

export interface AiModel {
  id: string;
  label: string;
  provider: "anthropic" | "openai";
  tier: "standard" | "advanced";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = `${import.meta.env.VITE_API_URL || ""}/ai`;

/** Fetch available AI models. */
export async function fetchModels(): Promise<AiModel[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  const data = await res.json();
  return data.models;
}

/**
 * Stream a chat response from the AI backend.
 * Calls `onToken` for each text chunk, `onDone` at end, `onError` on failure.
 * Returns an AbortController so the caller can cancel.
 */
export function streamChat(
  messages: ChatMessage[],
  model: string,
  canvasContext: string | null,
  callbacks: {
    onToken: (text: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  },
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model, canvas_context: canvasContext }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        callbacks.onError(`Request failed (${res.status}): ${errText}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError("No response stream");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const evt = JSON.parse(payload);
            if (evt.type === "text") {
              callbacks.onToken(evt.content);
            } else if (evt.type === "done") {
              callbacks.onDone();
              return;
            } else if (evt.type === "error") {
              callbacks.onError(evt.content);
              return;
            }
          } catch {
            // Not valid JSON — skip
          }
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      const message = (err as Error).message ?? "Unknown error";
      // Provide user-friendly messages for common network errors
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        callbacks.onError("Unable to reach the AI server. Please check that the backend is running and try again.");
      } else if (message.includes("timeout")) {
        callbacks.onError("The request timed out. Please try again.");
      } else {
        callbacks.onError(message);
      }
    }
  })();

  return controller;
}

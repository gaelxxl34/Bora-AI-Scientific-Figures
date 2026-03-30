// ChatInput: Prompt text input + send button
// TODO: Wire to chatStore.sendMessage()
// TODO: Disable while streaming
// TODO: Support Enter to send, Shift+Enter for newline

import { useState } from "react";

export function ChatInput() {
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    if (!prompt.trim()) return;
    // TODO: Dispatch to chatStore / streamService
    setPrompt("");
  };

  return (
    <div className="p-4 border-t border-border-gray">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Describe your figure..."
          className="flex-1 rounded-lg border border-border-gray px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bora-blue"
        />
        <button
          onClick={handleSend}
          className="bg-bora-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bora-blue/90"
        >
          Send
        </button>
      </div>
    </div>
  );
}

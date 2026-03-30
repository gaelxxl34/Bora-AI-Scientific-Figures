import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { StreamingIndicator } from "./StreamingIndicator";
import { SuggestionChips } from "./SuggestionChips";

// ChatPanel: AI chat sidebar container
// TODO: Wire to chatStore for message history
// TODO: Connect to streamService for SSE streaming
// TODO: Auto-scroll on new messages

export function ChatPanel() {
  // TODO: Read messages from chatStore
  const messages: { id: string; role: string; content: string }[] = [];
  const isStreaming = false;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-gray">
        <h2 className="text-sm font-semibold">AI Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <SuggestionChips />}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && <StreamingIndicator />}
      </div>

      <ChatInput />
    </div>
  );
}

// ChatMessage: Individual message bubble
// TODO: Render markdown content
// TODO: Style differently for user vs assistant messages

interface ChatMessageProps {
  role: string;
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-bora-blue text-white"
            : "bg-bora-blue-light text-ink-black"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

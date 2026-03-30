import { useState, useRef, useEffect, useCallback, type RefObject, type FC } from "react";
import { streamChat, type ChatMessage, type AiModel } from "../../services/aiService";
import { parseCommandBlocks, parseSvgBlocks, executeCommands, executeSvgOnCanvas } from "../../services/canvasCommands";
import type { CanvasHandle } from "./EditorCanvas";

interface DisplayMessage extends ChatMessage {
  error?: string;
  commandsExecuted?: number; // Number of objects added by AI commands
}

/* ── Model definitions (static, matches backend) ── */
const MODELS: AiModel[] = [
  { id: "claude-sonnet", label: "Claude Sonnet", provider: "anthropic", tier: "standard" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", tier: "standard" },
  { id: "claude-opus", label: "Claude Opus", provider: "anthropic", tier: "advanced" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", tier: "advanced" },
];

interface Props {
  canvasContext?: string | null;
  canvasRef?: RefObject<CanvasHandle | null>;
  onCanvasChanged?: () => void;
  initialMessages?: DisplayMessage[];
  onMessagesChange?: (messages: DisplayMessage[]) => void;
}

export function AIPanel({ canvasContext, canvasRef, onCanvasChanged, initialMessages, onMessagesChange }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("claude-sonnet");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onCanvasChangedRef = useRef(onCanvasChanged);
  onCanvasChangedRef.current = onCanvasChanged;
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  // Persist messages whenever they change (skip during streaming)
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (!isStreaming && messages.length > 0 && messages.length !== prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      onMessagesChangeRef.current?.(messages);
    }
  }, [messages, isStreaming]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const selectedModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

  const handleSend = useCallback((retryText?: string) => {
    const text = retryText ?? input.trim();
    if (!text || isStreaming) return;

    // If retrying, remove the last error message pair (user + error assistant)
    let baseMessages = messages;
    if (retryText && messages.length >= 2) {
      const lastAssistant = messages[messages.length - 1];
      if (lastAssistant.error) {
        baseMessages = messages.slice(0, -2);
      }
    }

    const userMsg: DisplayMessage = { role: "user", content: text };
    const history = [...baseMessages, userMsg];
    setMessages(history);
    if (!retryText) setInput("");
    setIsStreaming(true);

    // Add placeholder for assistant response
    const assistantIdx = history.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Start canvas generating animation
    const handle = canvasRef?.current;
    handle?.setGenerating(true);

    // Accumulate tokens silently — don't show raw JSON to user
    let accumulated = "";

    abortRef.current = streamChat(
      history.map(({ role, content }) => ({ role, content })),
      model,
      canvasContext ?? null,
      {
        onToken(token) {
          accumulated += token;
        },
        async onDone() {
          setIsStreaming(false);

          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIdx] = {
              ...updated[assistantIdx],
              content: accumulated, // Store full content for parsing
            };
            return updated;
          });

          // Parse and execute canvas commands from the AI response
          if (!handle) return;

          const fc = handle.getFabricCanvas();

          // Primary: ```objects command blocks (icon-based approach)
          const blocks = parseCommandBlocks(accumulated);
          if (blocks.length > 0) {
            const allCommands = blocks.flat();
            const count = await executeCommands(allCommands, handle, fc);
            handle.setGenerating(false);
            if (count > 0) {
              setMessages((p) => {
                const u = [...p];
                u[assistantIdx] = { ...u[assistantIdx], commandsExecuted: count };
                return u;
              });
              onCanvasChangedRef.current?.();
            }
            return;
          }

          // Fallback: ```svg blocks (raw SVG rendering)
          const svgBlocks = parseSvgBlocks(accumulated);
          if (svgBlocks.length > 0) {
            const count = await executeSvgOnCanvas(svgBlocks[0], fc);
            handle.setGenerating(false);
            if (count > 0) {
              setMessages((p) => {
                const u = [...p];
                u[assistantIdx] = { ...u[assistantIdx], commandsExecuted: count };
                return u;
              });
              onCanvasChangedRef.current?.();
            }
            return;
          }

          handle.setGenerating(false);
        },
        onError(error) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIdx] = {
              ...updated[assistantIdx],
              content: "",
              error,
            };
            return updated;
          });
          setIsStreaming(false);
          handle?.setGenerating(false);
        },
      },
    );
  }, [input, messages, model, isStreaming, canvasContext]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    canvasRef?.current?.setGenerating(false);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    canvasRef?.current?.setGenerating(false);
    onMessagesChangeRef.current?.([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = (userMsgContent: string) => {
    handleSend(userMsgContent);
  };

  /** Strip ```objects and ```svg blocks from displayed text */
  const stripCommandBlocks = (text: string) => {
    return text
      .replace(/```objects\s*\n[\s\S]*?```/g, "")
      .replace(/```svg\s*\n[\s\S]*?```/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Model selector ── */}
      <div className="px-3 pb-2 relative">
        <button
          onClick={() => setShowModels(!showModels)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border-gray bg-lab-white hover:border-bora-blue/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              selectedModel.tier === "advanced" ? "bg-amber-500" : "bg-green-500"
            }`} />
            <span className="text-xs font-medium text-ink-black truncate">{selectedModel.label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {selectedModel.tier === "advanced" && (
              <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Pro
              </span>
            )}
            <svg className={`w-3 h-3 text-slate transition-transform ${showModels ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </button>

        {showModels && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowModels(false)} />
            <div className="absolute left-3 right-3 top-full mt-1 z-20 bg-white border border-border-gray rounded-lg shadow-lg overflow-hidden">
              <div className="px-2.5 py-1.5 border-b border-border-gray">
                <p className="text-[10px] font-semibold text-slate uppercase tracking-wider">Standard</p>
              </div>
              {MODELS.filter((m) => m.tier === "standard").map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setShowModels(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-lab-white transition-colors ${
                    model === m.id ? "bg-bora-blue-light" : ""
                  }`}
                >
                  <ProviderIcon provider={m.provider} />
                  <span className="text-xs text-ink-black">{m.label}</span>
                  {model === m.id && (
                    <svg className="w-3 h-3 text-bora-blue ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}

              <div className="px-2.5 py-1.5 border-t border-b border-border-gray">
                <p className="text-[10px] font-semibold text-slate uppercase tracking-wider">
                  Advanced <span className="text-amber-600">(Pro)</span>
                </p>
              </div>
              {MODELS.filter((m) => m.tier === "advanced").map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setShowModels(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-lab-white transition-colors ${
                    model === m.id ? "bg-bora-blue-light" : ""
                  }`}
                >
                  <ProviderIcon provider={m.provider} />
                  <span className="text-xs text-ink-black">{m.label}</span>
                  <span className="text-[8px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded ml-auto">Pro</span>
                  {model === m.id && (
                    <svg className="w-3 h-3 text-bora-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-full bg-bora-blue-light flex items-center justify-center mb-3">
              <img src="/img/small%20logo.png" alt="Bora" className="w-5 h-5 object-contain" />
            </div>
            <p className="text-xs font-medium text-ink-black mb-1">Bora AI Assistant</p>
            <p className="text-[10px] text-slate leading-relaxed">
              Describe a figure and I'll build it directly on your canvas.
            </p>
            <div className="mt-3 space-y-1.5 w-full">
              {[
                "Create a cell signaling pathway diagram",
                "Build a western blot figure with gel and antibody labels",
                "Design an immune response overview with T-cells and antibodies",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left text-[10px] text-slate px-2.5 py-1.5 rounded-md border border-border-gray hover:border-bora-blue/30 hover:bg-bora-blue-light/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.error ? "bg-red-50" : "bg-bora-blue-light"
              }`}>
                {msg.error ? (
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                ) : (
                  <img src="/img/small%20logo.png" alt="Bora" className="w-3 h-3 object-contain" />
                )}
              </div>
            )}

            {/* Error message card */}
            {msg.role === "assistant" && msg.error ? (
              <div className="max-w-[85%] rounded-lg border border-red-200 bg-red-50 overflow-hidden">
                <div className="px-2.5 py-2 flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-[11px] text-red-600 leading-relaxed">{msg.error}</p>
                </div>
                <div className="border-t border-red-200 px-2.5 py-1.5 flex items-center gap-2 bg-red-50/50">
                  <button
                    onClick={() => {
                      // Find the user message right before this error
                      const userMsg = messages[i - 1];
                      if (userMsg?.role === "user") handleRetry(userMsg.content);
                    }}
                    className="text-[10px] font-medium text-red-700 hover:text-red-800 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                    </svg>
                    Retry
                  </button>
                  <span className="text-[10px] text-red-300">|</span>
                  <button
                    onClick={() => {
                      // Switch to a different model and retry
                      const currentModel = MODELS.find(m => m.id === model);
                      const altModel = MODELS.find(m => m.provider !== currentModel?.provider && m.tier === currentModel?.tier);
                      if (altModel) {
                        setModel(altModel.id);
                        const userMsg = messages[i - 1];
                        if (userMsg?.role === "user") {
                          // small delay so state updates
                          setTimeout(() => handleRetry(userMsg.content), 50);
                        }
                      }
                    }}
                    className="text-[10px] font-medium text-red-700 hover:text-red-800 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    Try different model
                  </button>
                </div>
              </div>
            ) : (
              /* Normal message bubble */
              <div className="max-w-[85%]">
                <div
                  className={`rounded-lg px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-bora-blue text-white"
                      : "bg-lab-white text-ink-black border border-border-gray"
                  }`}
                >
                  {msg.role === "assistant" && isStreaming && i === messages.length - 1 ? (
                    /* While streaming, show a clean status instead of raw JSON */
                    <span className="flex items-center gap-2 text-slate">
                      <img src="/img/small%20logo.png" alt="" className="w-3.5 h-3.5 object-contain animate-pulse" />
                      Designing your figure...
                    </span>
                  ) : msg.role === "assistant" ? (
                    <CollapsibleText text={stripCommandBlocks(msg.content) || (msg.commandsExecuted ? "Here\u2019s your figure!" : "")} />
                  ) : (
                    msg.content
                  )}
                </div>
                {/* Command execution badge */}
                {msg.role === "assistant" && msg.commandsExecuted && msg.commandsExecuted > 0 && (
                  <div className="mt-1 flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 border border-green-200 w-fit">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-[10px] font-medium text-green-700">
                      Figure rendered on canvas
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Input area ── */}
      <div className="px-3 pt-2 pb-3 border-t border-border-gray">
        {messages.length > 0 && (
          <div className="flex justify-end mb-1.5">
            <button
              onClick={handleClear}
              className="text-[10px] text-slate hover:text-ink-black transition-colors"
            >
              Clear chat
            </button>
          </div>
        )}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a figure or ask for help..."
            rows={2}
            className="w-full rounded-lg border border-border-gray px-3 py-2 pr-10 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-bora-blue/30 focus:border-bora-blue/50"
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="absolute right-2 bottom-2 w-6 h-6 flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Stop generating"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="absolute right-2 bottom-2 w-6 h-6 flex items-center justify-center rounded-md bg-bora-blue hover:bg-bora-blue/90 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Send (Enter)"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Collapsible text for long AI responses ── */
const COLLAPSE_THRESHOLD = 150;

const CollapsibleText: FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= COLLAPSE_THRESHOLD) return <>{text}</>;

  return (
    <>
      {expanded ? text : text.slice(0, COLLAPSE_THRESHOLD) + "..."}
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-bora-blue hover:underline font-medium"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </>
  );
};

/* ── Tiny provider icon ── */
function ProviderIcon({ provider }: { provider: "anthropic" | "openai" }) {
  if (provider === "anthropic") {
    return (
      <div className="w-4 h-4 rounded bg-[#d97757]/10 flex items-center justify-center shrink-0">
        <span className="text-[8px] font-bold text-[#d97757]">A</span>
      </div>
    );
  }
  return (
    <div className="w-4 h-4 rounded bg-[#10a37f]/10 flex items-center justify-center shrink-0">
      <span className="text-[8px] font-bold text-[#10a37f]">O</span>
    </div>
  );
}

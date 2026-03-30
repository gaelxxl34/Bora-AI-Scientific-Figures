import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface LogEntry {
  id: string;
  user_email: string;
  user_name: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  rating: number | null;
  created_at: string;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/admin/logs")
      .then((res) => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-black mb-1">AI Generation Logs</h1>
      <p className="text-sm text-slate mb-6">{logs.length} recent generations</p>

      <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cloud-gray/50 text-left text-slate">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium text-right">Prompt Tokens</th>
                <th className="px-4 py-3 font-medium text-right">Completion Tokens</th>
                <th className="px-4 py-3 font-medium text-right">Latency</th>
                <th className="px-4 py-3 font-medium text-center">Rating</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-cloud-gray rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate">No generation logs yet</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cloud-gray/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-black">{log.user_name || "—"}</p>
                      <p className="text-xs text-slate">{log.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-xs font-mono bg-cloud-gray px-2 py-0.5 rounded">{log.model}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate">{log.prompt_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate">{log.completion_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate">{(log.latency_ms / 1000).toFixed(1)}s</td>
                    <td className="px-4 py-3 text-center">
                      {log.rating != null ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          log.rating >= 4 ? "bg-green-100 text-green-700" :
                          log.rating >= 2 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{log.rating}/5</span>
                      ) : (
                        <span className="text-xs text-slate">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// figureStorage: localStorage-backed figure persistence
// Will be swapped for API calls when backend is ready

const STORAGE_KEY = "bora_figures";

/** Generate a UUID that works on both HTTP and HTTPS */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface SavedChatMessage {
  role: "user" | "assistant";
  content: string;
  commandsExecuted?: number;
}

export interface SavedFigure {
  id: string;
  title: string;
  pages: { id: number; label: string; json: string }[];
  chatMessages?: SavedChatMessage[];
  thumbnail?: string; // base64 PNG data URL (small preview)
  createdAt: string;
  updatedAt: string;
}

function readAll(): SavedFigure[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(figures: SavedFigure[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(figures));
}

export const figureStorage = {
  /** List all saved figures, newest first */
  list(): SavedFigure[] {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /** Get a single figure by ID */
  get(id: string): SavedFigure | null {
    return readAll().find((f) => f.id === id) ?? null;
  },

  /** Create a new figure, returns the saved figure */
  create(title: string): SavedFigure {
    const now = new Date().toISOString();
    const figure: SavedFigure = {
      id: generateId(),
      title,
      pages: [
        {
          id: 1,
          label: "Page 1",
          json: JSON.stringify({ version: "5.3.0", objects: [], background: "#ffffff" }),
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    all.push(figure);
    writeAll(all);
    return figure;
  },

  /** Save/update an existing figure */
  save(figure: SavedFigure): void {
    const all = readAll();
    const idx = all.findIndex((f) => f.id === figure.id);
    const updated = { ...figure, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.push(updated);
    }
    writeAll(all);
  },

  /** Delete a figure */
  delete(id: string): void {
    writeAll(readAll().filter((f) => f.id !== id));
  },

  /** Duplicate a figure */
  duplicate(id: string): SavedFigure | null {
    const original = this.get(id);
    if (!original) return null;
    const now = new Date().toISOString();
    const copy: SavedFigure = {
      ...original,
      id: generateId(),
      title: `${original.title} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    all.push(copy);
    writeAll(all);
    return copy;
  },
};

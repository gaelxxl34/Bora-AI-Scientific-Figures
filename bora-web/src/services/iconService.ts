// iconService: Local icon library backed by manifest.json + static SVGs
// Falls back to backend API when available

import type { Icon, IconSearchResult } from "../types/icon.types";
import { sanitizeSvg } from "../utils/sanitizeSvg";

interface ManifestEntry {
  id: string;
  name: string;
  category: string;
  source: string;
  path: string;
}

let _manifest: ManifestEntry[] | null = null;

const SUPABASE_MANIFEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/icons/manifest.json`;

async function loadManifest(): Promise<ManifestEntry[]> {
  if (_manifest) return _manifest;
  // Load from Supabase Storage; fall back to local for dev without connectivity
  let res: Response;
  try {
    res = await fetch(SUPABASE_MANIFEST_URL);
    if (!res.ok) throw new Error(res.statusText);
  } catch {
    res = await fetch("/icons/manifest.json");
  }
  _manifest = await res.json();
  return _manifest!;
}

function toIcon(entry: ManifestEntry): Icon {
  return {
    id: entry.id,
    name: entry.name,
    tags: entry.name.split(" "),
    category: entry.category,
    license: entry.source === "bioicons" ? "CC0" : "CC BY",
    source: entry.source,
    svg_url: entry.path,
  };
}

export const iconService = {
  async searchIcons(
    query: string,
    opts?: { category?: string; limit?: number }
  ): Promise<IconSearchResult> {
    const manifest = await loadManifest();
    const q = query.toLowerCase().trim();
    const limit = opts?.limit ?? 40;
    const terms = q.split(/\s+/).filter((w) => w.length > 0);

    // Score each entry: higher = better match
    let scored = manifest.map((entry) => {
      const text = `${entry.name} ${entry.category} ${entry.source}`.toLowerCase();
      const name = entry.name.toLowerCase();
      let score = 0;

      // Exact name match
      if (name === q) score += 200;
      // Name starts with query
      else if (name.startsWith(q)) score += 150;
      // Name contains full query
      else if (name.includes(q)) score += 100;
      // Category matches full query
      else if (entry.category.toLowerCase().includes(q)) score += 60;

      // Per-term matching: count how many terms match
      let matched = 0;
      for (const t of terms) {
        if (text.includes(t)) matched++;
      }
      if (matched === terms.length) score += 80; // all terms match
      else if (matched > 0) score += matched * 20; // partial match

      return { entry, score };
    }).filter((s) => s.score > 0);

    if (opts?.category) {
      scored = scored.filter((s) => s.entry.category === opts.category);
    }

    scored.sort((a, b) => b.score - a.score);
    const filtered = scored.map((s) => s.entry);
    const icons = filtered.slice(0, limit).map(toIcon);
    return { icons, total: filtered.length, query };
  },

  async browseCategory(
    category: string,
    opts?: { limit?: number }
  ): Promise<IconSearchResult> {
    const manifest = await loadManifest();
    const limit = opts?.limit ?? 60;
    const filtered = manifest.filter((e) => e.category === category);
    const icons = filtered.slice(0, limit).map(toIcon);
    return { icons, total: filtered.length, query: category };
  },

  async getIcon(id: string): Promise<Icon> {
    const manifest = await loadManifest();
    const entry = manifest.find((e) => e.id === id);
    if (!entry) throw new Error("Icon not found");
    // Fetch actual SVG content
    const res = await fetch(entry.path);
    const svgContent = sanitizeSvg(await res.text());
    return { ...toIcon(entry), svg_content: svgContent };
  },

  async getCategories(): Promise<string[]> {
    const manifest = await loadManifest();
    return [...new Set(manifest.map((e) => e.category))].sort();
  },

  async getCount(): Promise<number> {
    const manifest = await loadManifest();
    return manifest.length;
  },
};

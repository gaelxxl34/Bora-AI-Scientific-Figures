// icon.types.ts: TypeScript types for icons

export interface Icon {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  category: string | null;
  license: string | null;
  source: string;
  thumbnail_url?: string | null;
  svg_url?: string | null;
  svg_content?: string | null;
}

export interface IconSearchResult {
  icons: Icon[];
  total: number;
  query: string;
}

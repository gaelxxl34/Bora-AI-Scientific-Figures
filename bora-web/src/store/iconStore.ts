// iconStore: Zustand store for icon search cache and recent icons

import { create } from "zustand";
import type { Icon } from "../types/icon.types";
import { iconService } from "../services/iconService";

interface IconState {
  searchResults: Icon[];
  categories: string[];
  recentIcons: Icon[];
  isSearching: boolean;
  totalCount: number;
  query: string;
  activeCategory: string | null;
  categoryIcons: Icon[];
  categoryTotal: number;

  search: (query: string, category?: string) => Promise<void>;
  browseCategory: (category: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCount: () => Promise<void>;
  addRecentIcon: (icon: Icon) => void;
  setActiveCategory: (cat: string | null) => void;
  clearResults: () => void;
}

export const useIconStore = create<IconState>((set, get) => ({
  searchResults: [],
  categories: [],
  recentIcons: [],
  isSearching: false,
  totalCount: 0,
  query: "",
  activeCategory: null,
  categoryIcons: [],
  categoryTotal: 0,

  search: async (query, category) => {
    set({ isSearching: true, query });
    try {
      const result = await iconService.searchIcons(query, {
        category: category || get().activeCategory || undefined,
        limit: 40,
      });
      set({ searchResults: result.icons, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  browseCategory: async (category) => {
    set({ isSearching: true, activeCategory: category, categoryIcons: [] });
    try {
      const result = await iconService.browseCategory(category, { limit: 60 });
      set({ categoryIcons: result.icons, categoryTotal: result.total, isSearching: false });
    } catch {
      set({ categoryIcons: [], categoryTotal: 0, isSearching: false });
    }
  },

  fetchCategories: async () => {
    try {
      const cats = await iconService.getCategories();
      set({ categories: cats });
    } catch {
      // keep existing
    }
  },

  fetchCount: async () => {
    try {
      const total = await iconService.getCount();
      set({ totalCount: total });
    } catch {
      // keep existing
    }
  },

  addRecentIcon: (icon) =>
    set((state) => ({
      recentIcons: [icon, ...state.recentIcons.filter((i) => i.id !== icon.id)].slice(0, 20),
    })),

  setActiveCategory: (cat) => set({ activeCategory: cat }),

  clearResults: () => set({ searchResults: [], query: "" }),
}));

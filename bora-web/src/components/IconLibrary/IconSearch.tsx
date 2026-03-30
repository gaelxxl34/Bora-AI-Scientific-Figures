// IconSearch: Search input + results grid

import { useCallback, useEffect, useRef, useState } from "react";
import { useIconStore } from "../../store/iconStore";
import { IconCard } from "./IconCard";
import type { Icon } from "../../types/icon.types";

interface Props {
  onSelectIcon?: (icon: Icon) => void;
}

export function IconSearch({ onSelectIcon }: Props) {
  const [query, setQuery] = useState("");
  const { searchResults, isSearching, search, clearResults } = useIconStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(timerRef.current);
      if (value.trim().length < 2) {
        clearResults();
        return;
      }
      timerRef.current = setTimeout(() => {
        search(value.trim());
      }, 300);
    },
    [search, clearResults]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="px-4 pb-3">
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search icons…"
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-gray text-sm focus:outline-none focus:ring-2 focus:ring-bora-blue/30"
        />
      </div>

      {isSearching && (
        <p className="text-[10px] text-slate mt-2 animate-pulse">Searching…</p>
      )}

      {searchResults.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {searchResults.map((icon) => (
            <IconCard key={icon.id} icon={icon} onSelect={onSelectIcon} />
          ))}
        </div>
      )}

      {!isSearching && query.trim().length >= 2 && searchResults.length === 0 && (
        <p className="text-[10px] text-slate mt-3">No icons found for "{query}"</p>
      )}
    </div>
  );
}

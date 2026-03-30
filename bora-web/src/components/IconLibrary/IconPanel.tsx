import { useEffect, useState } from "react";
import { IconSearch } from "./IconSearch";
import { IconCategories } from "./IconCategories";
import { useIconStore } from "../../store/iconStore";
import type { Icon } from "../../types/icon.types";

// IconPanel: Icon library sidebar container — toggles between search and category views

interface Props {
  onSelectIcon?: (icon: Icon) => void;
}

export function IconPanel({ onSelectIcon }: Props) {
  const [view, setView] = useState<"search" | "categories">("search");
  const { fetchCategories, totalCount, fetchCount } = useIconStore();

  useEffect(() => {
    fetchCategories();
    fetchCount();
  }, [fetchCategories, fetchCount]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2">
        <button
          onClick={() => setView("search")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            view === "search"
              ? "bg-bora-blue-light text-bora-blue"
              : "text-slate hover:bg-lab-white"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setView("categories")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            view === "categories"
              ? "bg-bora-blue-light text-bora-blue"
              : "text-slate hover:bg-lab-white"
          }`}
        >
          Categories
        </button>
        {totalCount > 0 && (
          <span className="ml-auto text-[10px] text-slate self-center">
            {totalCount.toLocaleString()} icons
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "search" ? (
          <IconSearch onSelectIcon={onSelectIcon} />
        ) : (
          <IconCategories onSelectIcon={onSelectIcon} />
        )}
      </div>
    </div>
  );
}

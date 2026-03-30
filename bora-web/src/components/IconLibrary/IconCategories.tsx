// IconCategories: Browse icons by category — shows icons inline when selected

import { useIconStore } from "../../store/iconStore";
import { IconCard } from "./IconCard";
import type { Icon } from "../../types/icon.types";

interface Props {
  onSelectIcon?: (icon: Icon) => void;
}

export function IconCategories({ onSelectIcon }: Props) {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    browseCategory,
    categoryIcons,
    categoryTotal,
    isSearching,
  } = useIconStore();

  const handleClick = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
      return;
    }
    browseCategory(cat);
  };

  const handleBack = () => {
    setActiveCategory(null);
  };

  // When a category is selected, show its icons
  if (activeCategory) {
    return (
      <div className="flex flex-col overflow-hidden">
        {/* Back + category header */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2 text-xs text-bora-blue hover:text-bora-blue/80 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          All categories
        </button>
        <div className="px-4 pb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-ink-black">{activeCategory}</h4>
          <span className="text-[10px] text-slate">{categoryTotal} icons</span>
        </div>

        {isSearching && (
          <p className="text-[10px] text-slate px-4 animate-pulse">Loading…</p>
        )}

        {/* Icons grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {categoryIcons.map((icon) => (
              <IconCard key={icon.id} icon={icon} onSelect={onSelectIcon} />
            ))}
          </div>
          {!isSearching && categoryIcons.length === 0 && (
            <p className="text-[10px] text-slate mt-2">No icons in this category</p>
          )}
        </div>
      </div>
    );
  }

  // Category list
  return (
    <div className="px-4 pb-4 overflow-y-auto">
      <p className="text-[10px] font-semibold text-slate/50 uppercase tracking-wider mb-2">
        Browse by field
      </p>
      <div className="space-y-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className="w-full text-left text-xs px-2 py-1.5 rounded transition-colors text-slate hover:bg-lab-white hover:text-ink-black flex items-center justify-between"
          >
            <span>{cat}</span>
            <svg className="w-3 h-3 text-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

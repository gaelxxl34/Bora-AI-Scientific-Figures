// IconCard: Individual icon with SVG preview and drag support

import { useEffect, useState } from "react";
import type { Icon } from "../../types/icon.types";
import { iconService } from "../../services/iconService";
import { sanitizeSvg } from "../../utils/sanitizeSvg";

interface IconCardProps {
  icon: Icon;
  onSelect?: (icon: Icon) => void;
}

export function IconCard({ icon, onSelect }: IconCardProps) {
  const [svgContent, setSvgContent] = useState<string | null>(icon.svg_content ?? null);

  // Lazy-load SVG from path when svg_content isn't available
  useEffect(() => {
    if (svgContent) return;
    if (icon.svg_url) {
      fetch(icon.svg_url)
        .then((r) => r.text())
        .then((text) => setSvgContent(sanitizeSvg(text)))
        .catch(() => {});
    }
  }, [icon.svg_url, svgContent]);

  const handleDragStart = async (e: React.DragEvent) => {
    // Ensure we have svg_content for the canvas drop handler
    let payload = icon;
    if (!payload.svg_content && svgContent) {
      payload = { ...icon, svg_content: svgContent };
    }
    e.dataTransfer.setData("application/bora-icon", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleClick = async () => {
    if (!icon.svg_content) {
      // Fetch full icon with svg_content before adding to canvas
      try {
        const full = await iconService.getIcon(icon.id);
        onSelect?.(full);
        return;
      } catch {
        // fallback: use loaded svgContent
        if (svgContent) {
          onSelect?.({ ...icon, svg_content: svgContent });
          return;
        }
      }
    }
    onSelect?.(icon);
  };

  return (
    <button
      className="aspect-square rounded-lg border border-border-gray bg-lab-white hover:border-bora-blue hover:shadow-sm transition-all flex flex-col items-center justify-center gap-1 p-1.5 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={icon.name}
    >
      {svgContent ? (
        <div
          className="w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : icon.svg_url ? (
        <img src={icon.svg_url} alt={icon.name} className="w-8 h-8 object-contain" />
      ) : (
        <div className="w-8 h-8 rounded bg-bora-blue-light/50 flex items-center justify-center text-[8px] text-bora-blue font-bold">
          {icon.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-[8px] text-slate truncate w-full text-center leading-tight">
        {icon.name}
      </span>
    </button>
  );
}

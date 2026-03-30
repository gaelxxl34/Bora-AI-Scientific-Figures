// Tooltip: Hover tooltip component
// TODO: Support positioning (top, bottom, left, right)
// TODO: Implement with CSS or a library like @floating-ui

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-ink-black text-white text-[10px] rounded whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
}

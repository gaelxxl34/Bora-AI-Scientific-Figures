// Modal: Shared modal/dialog component
// TODO: Support title, close button, backdrop click to close
// TODO: Trap focus within modal for accessibility

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-slate hover:text-ink-black">
              &times;
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

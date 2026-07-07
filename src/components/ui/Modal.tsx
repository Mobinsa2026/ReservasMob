import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-900/20 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-soft-lg ring-1 ring-black/5 animate-[scaleIn_0.18s_ease-out] dark:bg-neutral-900 dark:ring-white/10">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-4 py-4 sm:px-6 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

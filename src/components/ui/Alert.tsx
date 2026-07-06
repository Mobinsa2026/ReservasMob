import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import { useMountTransition } from "../../hooks/useMountTransition";

type Variant = "success" | "warning" | "error";

const VARIANT_CONFIG: Record<
  Variant,
  { title: string; wrap: string; badge: string; icon: typeof CheckCircle2 }
> = {
  success: {
    title: "Listo",
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    badge: "bg-emerald-500 text-white",
    icon: CheckCircle2,
  },
  warning: {
    title: "Atención",
    wrap: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    badge: "bg-amber-500 text-white",
    icon: AlertTriangle,
  },
  error: {
    title: "Error",
    wrap: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    badge: "bg-red-500 text-white",
    icon: XCircle,
  },
};

export function Alert({
  variant,
  message,
  onDismiss,
  className = "",
}: {
  variant: Variant;
  message: string | null | false;
  onDismiss?: () => void;
  className?: string;
}) {
  const active = Boolean(message);
  const shouldRender = useMountTransition(active);
  const [lastMessage, setLastMessage] = useState(message || "");

  useEffect(() => {
    if (message) setLastMessage(message);
  }, [message]);

  if (!shouldRender) return null;

  const { title, wrap, badge, icon: Icon } = VARIANT_CONFIG[variant];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 ease-out ${wrap} ${
        active ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-95 opacity-0"
      } ${className}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${badge}`}>
        <Icon size={16} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{lastMessage}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

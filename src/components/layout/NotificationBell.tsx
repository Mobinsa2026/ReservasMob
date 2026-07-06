import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CalendarPlus, CheckCircle2, XCircle } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useMountTransition } from "../../hooks/useMountTransition";
import { formatDateTime } from "../../utils/dateRange";
import type { NotificationType } from "../../lib/types";

const PANEL_WIDTH = 360; // debe coincidir con el ancho usado en el estilo inline de abajo
const VIEWPORT_MARGIN = 16;

const TYPE_STYLES: Record<NotificationType, { icon: typeof CalendarPlus; badge: string }> = {
  new_request: {
    icon: CalendarPlus,
    badge: "bg-electric-100 text-electric-600 dark:bg-electric-500/20 dark:text-electric-300",
  },
  rejected: {
    icon: XCircle,
    badge: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  },
  approved: {
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(true);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldRender = useMountTransition(open);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      // Alinea el borde derecho del panel con el del botón, pero sin que se
      // salga de la pantalla por ningún lado (un botón cerca del borde
      // izquierdo, como en el sidebar, no puede simplemente usar `right`).
      const left = Math.min(
        Math.max(rect.right - panelWidth, VIEWPORT_MARGIN),
        window.innerWidth - panelWidth - VIEWPORT_MARGIN,
      );
      setCoords({ top: rect.bottom + 10, left });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="Notificaciones"
        className={`relative rounded-lg p-2 transition-colors ${
          open
            ? "bg-royal-50 text-royal-700 dark:bg-royal-500/15 dark:text-royal-300"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-neutral-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {shouldRender && coords && (
        <div
          ref={panelRef}
          style={{
            top: coords.top,
            left: coords.left,
            width: PANEL_WIDTH,
            maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          }}
          className={`fixed z-50 origin-top overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out dark:border-neutral-800 dark:bg-neutral-900 ${
            open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-royal-700 hover:underline dark:text-royal-400"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellOff size={22} className="text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No hay notificaciones.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.new_request;
                const Icon = style.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left text-sm last:border-b-0 transition-colors dark:border-neutral-800 ${
                      n.read
                        ? "text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                        : "bg-electric-50/50 hover:bg-electric-50 dark:bg-electric-500/10 dark:hover:bg-electric-500/15"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.badge}`}
                    >
                      <Icon size={16} strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <p
                        className={
                          n.read
                            ? ""
                            : "font-medium text-neutral-800 dark:text-neutral-100"
                        }
                      >
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        {formatDateTime(n.created)}
                      </p>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-electric-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}

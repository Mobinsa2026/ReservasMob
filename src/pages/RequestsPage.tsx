import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpDown, ClipboardList, Filter, Inbox, PlusCircle, User, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBookings } from "../hooks/useBookings";
import { useRooms } from "../hooks/useRooms";
import { canManageRequests, EXTRA_ITEMS } from "../lib/types";
import type { Booking } from "../lib/types";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { BookingDetailModal } from "../components/bookings/BookingDetailModal";
import { EXTRA_ICONS } from "../components/bookings/extraIcons";
import { formatDateTime, formatRange, isPast } from "../utils/dateRange";

export function RequestsPage() {
  const { user } = useAuth();
  const manage = user ? canManageRequests(user.role) : false;
  const [ownScope, setOwnScope] = useState<"mine" | "all">("mine");
  const effectiveScope = manage ? "all" : ownScope;
  const { bookings, loading, reload, patchLocal, removeLocal } = useBookings(effectiveScope);
  const { rooms } = useRooms();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [roomFilter, setRoomFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const showRequester = manage || ownScope === "all";

  const location = useLocation();
  const navigate = useNavigate();
  const [showCreatedBanner, setShowCreatedBanner] = useState(
    Boolean((location.state as { justCreated?: boolean } | null)?.justCreated),
  );

  function dismissCreatedBanner() {
    setShowCreatedBanner(false);
    navigate(location.pathname, { replace: true, state: {} });
  }

  const filtered = useMemo(() => {
    const list = roomFilter ? bookings.filter((b) => b.room === roomFilter) : bookings;
    return [...list].sort((a, b) => {
      const diff = new Date(a.created).getTime() - new Date(b.created).getTime();
      return sortOrder === "recent" ? -diff : diff;
    });
  }, [bookings, roomFilter, sortOrder]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-sm shadow-royal-900/20">
            <ClipboardList size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {manage ? "Todas las solicitudes" : ownScope === "all" ? "Todas las solicitudes" : "Mis solicitudes"}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {manage
                ? "Revisa, aprueba o rechaza las solicitudes de sala."
                : ownScope === "all"
                  ? "Tus solicitudes y las aprobadas de los demás."
                  : "Consulta el estado de tus solicitudes y el motivo si fue rechazada."}
            </p>
          </div>
        </div>
        <Link to="/bookings/new">
          <Button>
            <PlusCircle size={16} /> Nueva solicitud
          </Button>
        </Link>
      </div>

      <Alert
        variant="success"
        className="mb-6"
        message={
          showCreatedBanner &&
          "Tu solicitud fue enviada. Por el momento no se envían correos de confirmación, así que debes estar pendiente de esta página para ver cuándo se apruebe o rechace."
        }
        onDismiss={dismissCreatedBanner}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        {!manage && (
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setOwnScope("mine")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                ownScope === "mine"
                  ? "bg-white text-royal-700 shadow-sm dark:bg-neutral-700 dark:text-royal-300"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <User size={14} /> Mis solicitudes
            </button>
            <button
              type="button"
              onClick={() => setOwnScope("all")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                ownScope === "all"
                  ? "bg-white text-royal-700 shadow-sm dark:bg-neutral-700 dark:text-royal-300"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <Users size={14} /> Todas
            </button>
          </div>
        )}
        {rooms.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Filtrar por sala:
            </span>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors hover:border-neutral-400 focus:border-electric-500 focus:ring-4 focus:ring-electric-500/10 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">Todas las salas</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-neutral-400" />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Ordenar por:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "recent" | "oldest")}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors hover:border-neutral-400 focus:border-electric-500 focus:ring-4 focus:ring-electric-500/10 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
            <Inbox size={22} />
          </span>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {roomFilter ? "No hay solicitudes para esta sala." : "Aún no hay solicitudes."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-soft dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Sala</th>
                  <th className="px-4 py-3 font-medium">Horario</th>
                  <th className="px-4 py-3 font-medium">Extras</th>
                  <th className="px-4 py-3 font-medium">Solicitada el</th>
                  {showRequester && <th className="px-4 py-3 font-medium">Solicitante</th>}
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const requested = EXTRA_ITEMS.filter((item) => b[item.key]);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="cursor-pointer border-t border-neutral-100 bg-white transition-colors hover:bg-royal-50/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-royal-500/5"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                        {b.expand?.room?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {formatRange(b.start, b.end)}
                      </td>
                      <td className="px-4 py-3">
                        {requested.length === 0 ? (
                          <span className="text-neutral-400 dark:text-neutral-600">—</span>
                        ) : (
                          <div className="flex gap-1">
                            {requested.map((item) => {
                              const Icon = EXTRA_ICONS[item.key];
                              return (
                                <span
                                  key={item.key}
                                  title={item.label}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-royal-50 text-royal-600 dark:bg-royal-500/15 dark:text-royal-300"
                                >
                                  <Icon size={12} />
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {formatDateTime(b.created)}
                      </td>
                      {showRequester && (
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {b.requester_name || b.expand?.requested_by?.name || b.requester_email}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} past={isPast(b.end)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <BookingDetailModal
          booking={selected}
          canManage={manage}
          onClose={() => setSelected(null)}
          onUpdated={(id, patch) => {
            patchLocal(id, patch);
            // Refresca en segundo plano por si la acción disparó efectos en
            // otras filas (ej. rechazo automático de otras solicitudes del
            // mismo día).
            reload();
          }}
          onDeleted={(id) => {
            removeLocal(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

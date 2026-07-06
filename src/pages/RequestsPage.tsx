import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBookings } from "../hooks/useBookings";
import { useRooms } from "../hooks/useRooms";
import { canManageRequests } from "../lib/types";
import type { Booking } from "../lib/types";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { BookingDetailModal } from "../components/bookings/BookingDetailModal";
import { formatDateTime, formatRange } from "../utils/dateRange";

export function RequestsPage() {
  const { user } = useAuth();
  const manage = user ? canManageRequests(user.role) : false;
  const { bookings, loading, reload, patchLocal } = useBookings(manage ? "all" : "mine");
  const { rooms } = useRooms();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [roomFilter, setRoomFilter] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const [showCreatedBanner, setShowCreatedBanner] = useState(
    Boolean((location.state as { justCreated?: boolean } | null)?.justCreated),
  );

  function dismissCreatedBanner() {
    setShowCreatedBanner(false);
    navigate(location.pathname, { replace: true, state: {} });
  }

  const filtered = useMemo(
    () => (roomFilter ? bookings.filter((b) => b.room === roomFilter) : bookings),
    [bookings, roomFilter],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {manage ? "Todas las solicitudes" : "Mis solicitudes"}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {manage
              ? "Revisa, aprueba o rechaza las solicitudes de sala. Ordenadas por fecha de solicitud (más reciente primero)."
              : "Aquí puedes ver el estado de tus solicitudes de sala y el motivo si fue rechazada."}
          </p>
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

      {rooms.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Filtrar por sala:
          </label>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
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

      {loading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {roomFilter ? "No hay solicitudes para esta sala." : "Aún no hay solicitudes."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Sala</th>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium">Solicitada el</th>
                {manage && <th className="px-4 py-3 font-medium">Solicitante</th>}
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                    {b.expand?.room?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatRange(b.start, b.end)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatDateTime(b.created)}
                  </td>
                  {manage && (
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {b.expand?.requested_by?.email ?? b.requester_email}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        />
      )}
    </div>
  );
}

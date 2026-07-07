import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { Building2, CalendarDays, CalendarSearch } from "lucide-react";
import { useRooms } from "../hooks/useRooms";
import { useRoomAvailability } from "../hooks/useRoomAvailability";
import { StatusBadge } from "../components/ui/Badge";
import { formatRange, isPast, isSameDay } from "../utils/dateRange";

export function AvailabilityPage() {
  const { rooms, loading } = useRooms();
  const [roomId, setRoomId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const activeRoomId = roomId || rooms[0]?.id;
  const { bookings } = useRoomAvailability(activeRoomId);

  const approvedDays = useMemo(
    () => bookings.filter((b) => b.status === "approved").map((b) => new Date(b.start)),
    [bookings],
  );
  const pendingDays = useMemo(
    () => bookings.filter((b) => b.status === "pending").map((b) => new Date(b.start)),
    [bookings],
  );

  const dayBookings = bookings.filter((b) => isSameDay(new Date(b.start), selectedDay));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-sm shadow-royal-900/20">
          <CalendarSearch size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Disponibilidad
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Consulta qué días y horarios ya están ocupados por sala.
          </p>
        </div>
      </div>

      {!loading && (
        <div className="mb-6 flex flex-wrap gap-2">
          {rooms.map((r) => {
            const active = (roomId || rooms[0]?.id) === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRoomId(r.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-royal-600 text-white shadow-sm shadow-royal-900/20"
                    : "bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-royal-50 hover:text-royal-700 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800 dark:hover:bg-royal-500/10 dark:hover:text-royal-300"
                }`}
              >
                <Building2 size={15} />
                {r.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <DayPicker
              mode="single"
              locale={es}
              selected={selectedDay}
              onSelect={(d) => d && setSelectedDay(d)}
              modifiers={{ approved: approvedDays, pending: pendingDays }}
              modifiersClassNames={{
                approved: "rdp-day_approved",
                pending: "rdp-day_pending",
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Aprobada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendiente
            </span>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <CalendarDays size={16} className="text-royal-600 dark:text-royal-400" />
            Reservas del {selectedDay.toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
          {dayBookings.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay reservas ese día para esta sala.
            </p>
          ) : (
            <ul className="space-y-2">
              {dayBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2.5 text-sm dark:border-neutral-800"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {formatRange(b.start, b.end)}
                  </span>
                  <StatusBadge status={b.status} past={isPast(b.end)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

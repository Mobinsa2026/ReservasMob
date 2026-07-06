import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { useRooms } from "../hooks/useRooms";
import { useRoomAvailability } from "../hooks/useRoomAvailability";
import { StatusBadge } from "../components/ui/Badge";
import { formatRange, isSameDay } from "../utils/dateRange";

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
      <h1 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Disponibilidad
      </h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Consulta qué días y horarios ya están ocupados por sala.
      </p>

      {!loading && (
        <div className="mb-6 flex flex-wrap gap-2">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                (roomId || rooms[0]?.id) === r.id
                  ? "bg-royal-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
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
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Aprobada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendiente
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {formatRange(b.start, b.end)}
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

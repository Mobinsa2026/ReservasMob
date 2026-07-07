import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import {
  Ban,
  Building2,
  CalendarDays,
  Clock,
  MessageSquare,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../hooks/useRooms";
import { useRoomAvailability } from "../hooks/useRoomAvailability";
import { pb } from "../lib/pocketbase";
import { Input, Select, TextArea } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { ExtraOptionCard } from "../components/bookings/ExtraOptionCard";
import { EXTRA_ICONS } from "../components/bookings/extraIcons";
import { combineDateAndTime, isSameDay, TIME_SLOTS } from "../utils/dateRange";

export function NewBookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms, loading: roomsLoading } = useRooms();

  const [roomId, setRoomId] = useState("");
  const [day, setDay] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [peopleCount, setPeopleCount] = useState(1);
  const [reason, setReason] = useState("");
  const [requesterName, setRequesterName] = useState(user?.name ?? "");
  const [wantsCoffee, setWantsCoffee] = useState(false);
  const [wantsCookies, setWantsCookies] = useState(false);
  const [wantsWater, setWantsWater] = useState(false);
  const [wantsSnack, setWantsSnack] = useState(false);
  const [noExtras, setNoExtras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleExtra(setter: (v: boolean) => void, checked: boolean) {
    setter(checked);
    if (checked) setNoExtras(false);
  }

  function toggleNoExtras(checked: boolean) {
    setNoExtras(checked);
    if (checked) {
      setWantsCoffee(false);
      setWantsCookies(false);
      setWantsWater(false);
      setWantsSnack(false);
    }
  }

  const nothingChosenYet =
    !wantsCoffee && !wantsCookies && !wantsWater && !wantsSnack && !noExtras;

  const { bookings: roomBookings } = useRoomAvailability(roomId || undefined);

  // Marcadores informativos en el calendario (no bloquean el día completo:
  // el bloqueo real es por horario, no por día).
  const approvedDays = useMemo(
    () => roomBookings.filter((b) => b.status === "approved").map((b) => new Date(b.start)),
    [roomBookings],
  );
  const pendingDays = useMemo(
    () => roomBookings.filter((b) => b.status === "pending").map((b) => new Date(b.start)),
    [roomBookings],
  );

  // Solicitudes pendientes de OTRAS personas para el día elegido: no bloquean,
  // pero avisamos porque podrían competir por el mismo horario.
  const pendingSameDayFromOthers = useMemo(() => {
    if (!day) return [];
    return roomBookings.filter(
      (b) =>
        b.status === "pending" &&
        isSameDay(new Date(b.start), day) &&
        b.requested_by !== user?.id,
    );
  }, [roomBookings, day, user?.id]);

  // El bloqueo real es por horario: dos reservas aprobadas pueden coexistir
  // el mismo día si no se traslapan (ej. 9-13 y 13-15).
  const selectedRange = useMemo(() => {
    if (!day) return null;
    return { start: combineDateAndTime(day, startTime), end: combineDateAndTime(day, endTime) };
  }, [day, startTime, endTime]);

  const overlapsApproved = useMemo(() => {
    if (!selectedRange) return false;
    return roomBookings.some(
      (b) =>
        b.status === "approved" &&
        new Date(b.start) < selectedRange.end &&
        new Date(b.end) > selectedRange.start,
    );
  }, [roomBookings, selectedRange]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roomId) return setError("Selecciona una sala.");
    if (!day) return setError("Selecciona un día.");
    if (!requesterName.trim()) return setError("Indica el nombre de quién solicita la sala.");

    const start = combineDateAndTime(day, startTime);
    const end = combineDateAndTime(day, endTime);

    if (start >= end) {
      return setError("La hora de inicio debe ser anterior a la hora de fin.");
    }
    if (start < new Date()) {
      return setError("No puedes reservar en una fecha/hora pasada.");
    }
    if (overlapsApproved) {
      return setError("Ese horario se traslapa con una reserva ya aprobada para esta sala.");
    }
    if (nothingChosenYet) {
      return setError(
        "Indica si necesitas café, galletas, agua o snack, o marca que no necesitas nada.",
      );
    }

    setLoading(true);
    try {
      await pb.collection("bookings").create({
        room: roomId,
        reason,
        start: start.toISOString(),
        end: end.toISOString(),
        people_count: peopleCount,
        requester_name: requesterName.trim(),
        wants_coffee: wantsCoffee,
        wants_cookies: wantsCookies,
        wants_water: wantsWater,
        wants_snack: wantsSnack,
        no_extras: noExtras,
      });
      navigate("/", { state: { justCreated: true } });
    } catch {
      setError("No se pudo crear la solicitud. Verifica los datos e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-sm shadow-royal-900/20">
          <CalendarDays size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Nueva solicitud de sala
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Elige la sala, el día y el horario. Una sala puede tener varias reservas aprobadas el
            mismo día, siempre que no se traslapen los horarios.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <Select
            label="Sala"
            icon={<Building2 size={16} />}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            disabled={roomsLoading}
          >
            <option value="">Selecciona una sala</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Hora inicio"
              icon={<Clock size={16} />}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              label="Hora fin"
              icon={<Clock size={16} />}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Número de personas"
            icon={<UsersIcon size={16} />}
            type="number"
            min={1}
            value={peopleCount}
            onChange={(e) => setPeopleCount(Number(e.target.value))}
            required
          />

          <TextArea
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="¿Para qué necesitas la sala?"
            required
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              ¿Necesitas algo para la reunión?
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ExtraOptionCard
                icon={<EXTRA_ICONS.wants_coffee size={18} />}
                label="Café"
                checked={wantsCoffee}
                onChange={(v) => toggleExtra(setWantsCoffee, v)}
              />
              <ExtraOptionCard
                icon={<EXTRA_ICONS.wants_cookies size={18} />}
                label="Galletas"
                checked={wantsCookies}
                onChange={(v) => toggleExtra(setWantsCookies, v)}
              />
              <ExtraOptionCard
                icon={<EXTRA_ICONS.wants_water size={18} />}
                label="Agua"
                checked={wantsWater}
                onChange={(v) => toggleExtra(setWantsWater, v)}
              />
              <ExtraOptionCard
                icon={<EXTRA_ICONS.wants_snack size={18} />}
                label="Snack"
                checked={wantsSnack}
                onChange={(v) => toggleExtra(setWantsSnack, v)}
              />
            </div>
            <button
              type="button"
              onClick={() => toggleNoExtras(!noExtras)}
              aria-pressed={noExtras}
              className={`mt-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                noExtras
                  ? "border-neutral-400 bg-neutral-100 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                  : "border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <Ban size={16} /> No necesito nada de esto
            </button>
          </div>

          <Input
            label="Nombre"
            icon={<User size={16} />}
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="¿A nombre de quién es la solicitud?"
            required
          />

          <Alert
            variant="warning"
            message={
              pendingSameDayFromOthers.length > 0 &&
              `Hay ${pendingSameDayFromOthers.length === 1 ? "otra solicitud pendiente" : "otras solicitudes pendientes"} para esta sala ese mismo día. Si el horario se traslapa con el tuyo, solo una podrá ser aprobada.`
            }
          />

          <Alert
            variant="warning"
            message={
              overlapsApproved &&
              "El horario elegido se traslapa con una reserva ya aprobada para esta sala. Elige otro horario ese mismo día o cambia de sala."
            }
          />

          <Alert variant="error" message={error} />

          <Button
            type="submit"
            loading={loading}
            disabled={overlapsApproved}
            className="w-full md:w-auto"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <MessageSquare size={16} className="text-royal-600 dark:text-royal-400" />
            Elige el día
          </p>
          <div className="overflow-x-auto">
            <DayPicker
              mode="single"
              locale={es}
              selected={day}
              onSelect={setDay}
              disabled={[{ before: new Date() }]}
              modifiers={{ approved: approvedDays, pending: pendingDays }}
              modifiersClassNames={{ approved: "rdp-day_approved", pending: "rdp-day_pending" }}
            />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Ya tiene una reserva
              aprobada ese día (aún puedes elegir otro horario libre)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Hay solicitudes
              pendientes ese día
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}

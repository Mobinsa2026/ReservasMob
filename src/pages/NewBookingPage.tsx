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

  const approvedDays = useMemo(
    () => roomBookings.filter((b) => b.status === "approved").map((b) => new Date(b.start)),
    [roomBookings],
  );

  // Solicitudes pendientes de OTRAS personas para el día elegido: no bloquean,
  // pero avisamos porque solo una puede terminar aprobada para ese día.
  const pendingSameDayFromOthers = useMemo(() => {
    if (!day) return [];
    return roomBookings.filter(
      (b) =>
        b.status === "pending" &&
        isSameDay(new Date(b.start), day) &&
        b.requested_by !== user?.id,
    );
  }, [roomBookings, day, user?.id]);

  const dayAlreadyApproved = useMemo(() => {
    if (!day) return false;
    return approvedDays.some((d) => isSameDay(d, day));
  }, [approvedDays, day]);

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
    if (dayAlreadyApproved) {
      return setError("Ya hay una reserva aprobada para esta sala ese día.");
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
            Elige la sala, el día y el horario. Una sala solo puede tener una reserva aprobada por
            día.
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
              `Ya hay ${pendingSameDayFromOthers.length === 1 ? "otra solicitud pendiente" : "otras solicitudes pendientes"} para esta sala ese mismo día. Solo una puede ser aprobada, así que la tuya podría ser rechazada si aprueban la otra primero.`
            }
          />

          <Alert variant="error" message={error} />

          <Button
            type="submit"
            loading={loading}
            disabled={dayAlreadyApproved}
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
              disabled={[{ before: new Date() }, ...approvedDays]}
              modifiers={{ booked: approvedDays }}
              modifiersClassNames={{ booked: "rdp-day_booked" }}
            />
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Días ya reservados
            (sala completa, no seleccionables)
          </p>
        </div>
      </form>
    </div>
  );
}

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../hooks/useRooms";
import { useRoomAvailability } from "../hooks/useRoomAvailability";
import { pb } from "../lib/pocketbase";
import { Checkbox, Input, Select, TextArea } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
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
  const [requesterEmail, setRequesterEmail] = useState(user?.email ?? "");
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
        requester_email: requesterEmail,
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
      <h1 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Nueva solicitud de sala
      </h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Elige la sala, el día y el horario que necesitas. Una sala solo puede tener una reserva
        aprobada por día.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Select
            label="Sala"
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
            <Select label="Hora inicio" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select label="Hora fin" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Número de personas"
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
            <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              ¿Necesitas algo para la reunión?
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <Checkbox
                label="Café"
                checked={wantsCoffee}
                onChange={(e) => toggleExtra(setWantsCoffee, e.target.checked)}
              />
              <Checkbox
                label="Galletas"
                checked={wantsCookies}
                onChange={(e) => toggleExtra(setWantsCookies, e.target.checked)}
              />
              <Checkbox
                label="Agua"
                checked={wantsWater}
                onChange={(e) => toggleExtra(setWantsWater, e.target.checked)}
              />
              <Checkbox
                label="Snack"
                checked={wantsSnack}
                onChange={(e) => toggleExtra(setWantsSnack, e.target.checked)}
              />
              <div className="col-span-2 mt-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                <Checkbox
                  label="No necesito nada de esto"
                  checked={noExtras}
                  onChange={(e) => toggleNoExtras(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <Input
            label="Correo para confirmación"
            type="email"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
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

          <Button type="submit" disabled={loading || dayAlreadyApproved} className="w-full md:w-auto">
            {loading ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>

        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Elige el día
          </p>
          <DayPicker
            mode="single"
            locale={es}
            selected={day}
            onSelect={setDay}
            disabled={[{ before: new Date() }, ...approvedDays]}
            modifiers={{ booked: approvedDays }}
            modifiersClassNames={{ booked: "rdp-day_booked" }}
          />
          <p className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Días ya reservados
            (sala completa, no seleccionables)
          </p>
        </div>
      </form>
    </div>
  );
}

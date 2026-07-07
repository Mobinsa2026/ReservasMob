import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Mail, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { pb } from "../lib/pocketbase";
import type { Room } from "../lib/types";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Checkbox, Input } from "../components/ui/Field";

export function RoomsPage() {
  const { user } = useAuth();
  const canDelete = user?.role === "adminvip";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    return pb
      .collection("rooms")
      .getFullList<Room>({ sort: "location,name" })
      .then(setRooms);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function saveField(room: Room, patch: Partial<Room>) {
    setError(null);
    const previous = rooms;
    setRooms((list) => list.map((r) => (r.id === room.id ? { ...r, ...patch } : r)));
    try {
      await pb.collection("rooms").update(room.id, patch);
    } catch {
      setRooms(previous);
      setError("No se pudo guardar el cambio.");
    }
  }

  async function removeRoom(room: Room) {
    if (!confirm(`¿Eliminar la sala "${room.name}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    const previous = rooms;
    setRooms((list) => list.filter((r) => r.id !== room.id));
    try {
      await pb.collection("rooms").delete(room.id);
    } catch {
      setRooms(previous);
      setError("No se pudo eliminar la sala (puede tener solicitudes asociadas).");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-sm shadow-royal-900/20">
            <Building2 size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Salas
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Agrega salas y define a qué correos avisar cuando llega una solicitud nueva.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nueva sala
        </Button>
      </div>

      <Alert variant="error" className="mb-4" message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          Aún no hay salas. Crea la primera con "Nueva sala".
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              canDelete={canDelete}
              onSave={(patch) => saveField(room, patch)}
              onDelete={() => removeRoom(room)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => {
            setRooms((list) => [...list, room]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function RoomCard({
  room,
  canDelete,
  onSave,
  onDelete,
}: {
  room: Room;
  canDelete: boolean;
  onSave: (patch: Partial<Room>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [location, setLocation] = useState(room.location ?? "");
  const [capacity, setCapacity] = useState(room.capacity ?? 0);
  const [notifyEmails, setNotifyEmails] = useState(room.notify_emails ?? "");

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Nombre de la sala"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== room.name && onSave({ name: name.trim() })}
        />
        <Input
          label="Sede / ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => location !== (room.location ?? "") && onSave({ location })}
          placeholder="Ej. Chihuahua, Juárez"
        />
        <Input
          label="Capacidad"
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          onBlur={() => capacity !== (room.capacity ?? 0) && onSave({ capacity })}
        />
        <Checkbox
          label="Sala activa (visible al pedir reserva)"
          checked={room.active}
          onChange={(e) => onSave({ active: e.target.checked })}
        />
      </div>

      <div className="mt-3">
        <Input
          label="Correos que reciben aviso de solicitudes nuevas"
          icon={<Mail size={16} />}
          value={notifyEmails}
          onChange={(e) => setNotifyEmails(e.target.value)}
          onBlur={() =>
            notifyEmails !== (room.notify_emails ?? "") && onSave({ notify_emails: notifyEmails })
          }
          placeholder="correo1@empresa.com, correo2@empresa.com"
        />
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Sepáralos con comas. No necesitan tener cuenta en el sistema.
        </p>
      </div>

      {canDelete && (
        <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
          >
            <Trash2 size={13} /> Eliminar sala
          </button>
        </div>
      )}
    </div>
  );
}

function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [notifyEmails, setNotifyEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Indica el nombre de la sala.");
    setError(null);
    setLoading(true);
    try {
      const room = await pb.collection("rooms").create<Room>({
        name: name.trim(),
        location: location.trim(),
        capacity,
        notify_emails: notifyEmails.trim(),
        active: true,
      });
      onCreated(room);
    } catch {
      setError("No se pudo crear la sala (¿ya existe una con ese nombre?).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Nueva sala" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <Input
          label="Sede / ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ej. Chihuahua, Juárez"
        />
        <Input
          label="Capacidad"
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <Input
          label="Correos que reciben aviso de solicitudes nuevas"
          icon={<Mail size={16} />}
          value={notifyEmails}
          onChange={(e) => setNotifyEmails(e.target.value)}
          placeholder="correo1@empresa.com, correo2@empresa.com"
        />
        <Alert variant="error" message={error} />
        <div className="flex gap-2">
          <Button type="submit" loading={loading}>
            Crear sala
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

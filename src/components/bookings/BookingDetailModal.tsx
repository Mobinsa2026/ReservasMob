import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Clock4, Trash2, User, Users as UsersIcon, X as XIcon } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/Field";
import { StatusBadge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import { pb } from "../../lib/pocketbase";
import { EXTRA_ITEMS } from "../../lib/types";
import type { Booking } from "../../lib/types";
import { formatRange, isPast } from "../../utils/dateRange";
import { EXTRA_ICONS } from "./extraIcons";

export function BookingDetailModal({
  booking,
  canManage,
  onClose,
  onUpdated,
  onDeleted,
}: {
  booking: Booking;
  canManage: boolean;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<Booking>) => void;
  onDeleted: (id: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestedExtras = EXTRA_ITEMS.filter((item) => booking[item.key]);
  const [extrasApproval, setExtrasApproval] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(requestedExtras.map((item) => [item.approvedKey, booking[item.approvedKey] ?? true])),
  );
  const [extrasComment, setExtrasComment] = useState(booking.extras_comment ?? "");

  const roomName = booking.expand?.room?.name ?? "Sala";
  const requesterName =
    booking.requester_name || booking.expand?.requested_by?.name || booking.requester_email;

  function extrasPayload() {
    return {
      ...Object.fromEntries(requestedExtras.map((item) => [item.approvedKey, extrasApproval[item.approvedKey]])),
      extras_comment: extrasComment.trim(),
    };
  }

  async function approve() {
    setError(null);
    setLoading(true);
    try {
      const payload = { status: "approved" as const, rejection_reason: "", ...extrasPayload() };
      await pb.collection("bookings").update(booking.id, payload);
      onUpdated(booking.id, payload);
      onClose();
    } catch {
      setError("No se pudo aprobar: el horario se traslapa con otra reserva aprobada.");
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError("Debes indicar una razón de rechazo.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const trimmedReason = reason.trim();
      const payload = { status: "rejected" as const, rejection_reason: trimmedReason, ...extrasPayload() };
      await pb.collection("bookings").update(booking.id, payload);
      onUpdated(booking.id, payload);
      onClose();
    } catch {
      setError("No se pudo rechazar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setError(null);
    setLoading(true);
    try {
      await pb.collection("bookings").delete(booking.id);
      onDeleted(booking.id);
      onClose();
    } catch {
      setError("No se pudo eliminar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={roomName} subtitle={formatRange(booking.start, booking.end)} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Estado</span>
          <StatusBadge status={booking.status} past={isPast(booking.end)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoTile icon={<Clock4 size={15} />} label="Horario" value={formatRange(booking.start, booking.end)} />
          <InfoTile icon={<UsersIcon size={15} />} label="Personas" value={String(booking.people_count)} />
        </div>
        <InfoTile icon={<User size={15} />} label="Solicitante" value={requesterName} />
        <Detail label="Motivo" value={booking.reason} />
        {booking.status === "rejected" && booking.rejection_reason && (
          <Detail label="Razón de rechazo" value={booking.rejection_reason} tone="danger" />
        )}

        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Extras solicitados
          </span>
          {requestedExtras.length === 0 ? (
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">No solicitó nada extra.</p>
          ) : canManage && booking.status === "pending" ? (
            <div className="mt-2 space-y-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Desmarca lo que no se pueda cumplir y explica por qué en el comentario.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {requestedExtras.map((item) => {
                  const Icon = EXTRA_ICONS[item.key];
                  const approved = extrasApproval[item.approvedKey];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={approved}
                      onClick={() =>
                        setExtrasApproval((prev) => ({ ...prev, [item.approvedKey]: !prev[item.approvedKey] }))
                      }
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-colors ${
                        approved
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                          : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                      }`}
                    >
                      <span className="relative">
                        <Icon
                          size={18}
                          className={approved ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}
                        />
                        <span
                          className={`absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white ${
                            approved ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        >
                          {approved ? <Check size={9} strokeWidth={3} /> : <XIcon size={9} strokeWidth={3} />}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <TextArea
                label="Comentario sobre extras (opcional)"
                value={extrasComment}
                onChange={(e) => setExtrasComment(e.target.value)}
                placeholder="Ej. no hay café disponible por el momento"
              />
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {requestedExtras.map((item) => {
                const Icon = EXTRA_ICONS[item.key];
                const ok = booking[item.approvedKey];
                return (
                  <span
                    key={item.key}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      ok
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                    }`}
                  >
                    <Icon size={13} /> {item.label} {ok ? "" : "· no disponible"}
                  </span>
                );
              })}
              {booking.extras_comment && (
                <p className="mt-1 w-full text-neutral-600 dark:text-neutral-400">
                  Comentario: {booking.extras_comment}
                </p>
              )}
            </div>
          )}
        </div>

        <Alert variant="error" message={error} />

        {canManage && booking.status === "pending" && (
          <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {rejecting ? (
              <>
                <TextArea
                  label="Razón de rechazo"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="danger" onClick={reject} loading={loading}>
                    Confirmar rechazo
                  </Button>
                  <Button variant="ghost" onClick={() => setRejecting(false)} disabled={loading}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button onClick={approve} loading={loading}>
                  Aprobar
                </Button>
                <Button variant="danger" onClick={() => setRejecting(true)} disabled={loading}>
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        )}

        {canManage && (
          <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {confirmingDelete ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-500/30 dark:bg-red-500/10">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  ¿Eliminar esta solicitud permanentemente?
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="danger" onClick={remove} loading={loading}>
                    Sí, eliminar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
              >
                <Trash2 size={13} /> Eliminar solicitud
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <p
        className={`mt-1 whitespace-pre-wrap ${
          tone === "danger"
            ? "text-red-600 dark:text-red-400"
            : "text-neutral-800 dark:text-neutral-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

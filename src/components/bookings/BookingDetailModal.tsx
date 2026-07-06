import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Checkbox, TextArea } from "../ui/Field";
import { StatusBadge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import { pb } from "../../lib/pocketbase";
import { EXTRA_ITEMS } from "../../lib/types";
import type { Booking } from "../../lib/types";
import { formatRange } from "../../utils/dateRange";

export function BookingDetailModal({
  booking,
  canManage,
  onClose,
  onUpdated,
}: {
  booking: Booking;
  canManage: boolean;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<Booking>) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestedExtras = EXTRA_ITEMS.filter((item) => booking[item.key]);
  const [extrasApproval, setExtrasApproval] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(requestedExtras.map((item) => [item.approvedKey, booking[item.approvedKey] ?? true])),
  );
  const [extrasComment, setExtrasComment] = useState(booking.extras_comment ?? "");

  const roomName = booking.expand?.room?.name ?? "Sala";
  const requesterEmail = booking.expand?.requested_by?.email ?? booking.requester_email;

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

  return (
    <Modal title={roomName} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Estado</span>
          <StatusBadge status={booking.status} />
        </div>
        <Detail label="Horario" value={formatRange(booking.start, booking.end)} />
        <Detail label="Personas" value={String(booking.people_count)} />
        <Detail label="Solicitante" value={requesterEmail} />
        <Detail label="Motivo" value={booking.reason} multiline />
        {booking.status === "rejected" && booking.rejection_reason && (
          <Detail label="Razón de rechazo" value={booking.rejection_reason} multiline />
        )}

        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400">Extras solicitados</span>
          {requestedExtras.length === 0 ? (
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">No solicitó nada extra.</p>
          ) : canManage && booking.status === "pending" ? (
            <div className="mt-2 space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Desmarca lo que no se pueda cumplir y explica por qué en el comentario.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {requestedExtras.map((item) => (
                  <Checkbox
                    key={item.key}
                    label={item.label}
                    checked={extrasApproval[item.approvedKey]}
                    onChange={(e) =>
                      setExtrasApproval((prev) => ({ ...prev, [item.approvedKey]: e.target.checked }))
                    }
                  />
                ))}
              </div>
              <TextArea
                label="Comentario sobre extras (opcional)"
                value={extrasComment}
                onChange={(e) => setExtrasComment(e.target.value)}
                placeholder="Ej. no hay café disponible por el momento"
              />
            </div>
          ) : (
            <div className="mt-1 space-y-1">
              {requestedExtras.map((item) => (
                <p key={item.key} className="text-neutral-700 dark:text-neutral-300">
                  {item.label}: {booking[item.approvedKey] ? "Sí" : "No disponible"}
                </p>
              ))}
              {booking.extras_comment && (
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
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
                  <Button variant="danger" onClick={reject} disabled={loading}>
                    Confirmar rechazo
                  </Button>
                  <Button variant="ghost" onClick={() => setRejecting(false)} disabled={loading}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button onClick={approve} disabled={loading}>
                  Aprobar
                </Button>
                <Button variant="danger" onClick={() => setRejecting(true)} disabled={loading}>
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "" : "flex items-center justify-between gap-4"}>
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <p
        className={
          multiline
            ? "mt-1 text-neutral-800 dark:text-neutral-200"
            : "truncate text-right font-medium text-neutral-800 dark:text-neutral-200"
        }
      >
        {value}
      </p>
    </div>
  );
}

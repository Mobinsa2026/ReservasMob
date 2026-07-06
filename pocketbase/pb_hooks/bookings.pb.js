/// <reference path="../pb_data/types.d.ts" />

// El cliente nunca decide quién solicita ni el estado inicial. Una sala solo
// puede tener UNA reserva aprobada por día: si ya hay una aprobada ese día,
// se bloquea la creación. Las solicitudes pendientes del mismo día NO se
// bloquean entre sí (varias personas pueden competir por el mismo día; la
// primera que se apruebe rechaza automáticamente a las demás, ver abajo).
onRecordCreateRequest((e) => {
  e.record.set("requested_by", e.auth.id);
  e.record.set("status", "pending");
  e.record.set("rejection_reason", "");

  // Las aprobaciones de extras las decide RH después; nunca al crear.
  e.record.set("coffee_approved", false);
  e.record.set("cookies_approved", false);
  e.record.set("water_approved", false);
  e.record.set("snack_approved", false);
  e.record.set("extras_comment", "");

  const wantsSomething =
    e.record.get("wants_coffee") ||
    e.record.get("wants_cookies") ||
    e.record.get("wants_water") ||
    e.record.get("wants_snack");
  if (!wantsSomething && !e.record.get("no_extras")) {
    throw new BadRequestError(
      "Indica si necesitas café, galletas, agua o snack, o marca que no necesitas nada.",
    );
  }

  const room = e.record.get("room");
  const start = e.record.get("start");
  const end = e.record.get("end");

  if (new Date(start) >= new Date(end)) {
    throw new BadRequestError("La hora de inicio debe ser anterior a la hora de fin.");
  }
  if (new Date(start) < new Date()) {
    throw new BadRequestError("No se puede reservar en una fecha/hora pasada.");
  }

  const d = new Date(start);
  const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .replace("T", " ");
  const dayEnd = new Date(new Date(dayStart.replace(" ", "T")).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ");

  const approvedSameDay = e.app.findRecordsByFilter(
    "bookings",
    "room = {:room} && status = 'approved' && start >= {:dayStart} && start < {:dayEnd}",
    "",
    1,
    0,
    { room, dayStart, dayEnd },
  );
  if (approvedSameDay.length > 0) {
    throw new BadRequestError("Ya hay una reserva aprobada para esta sala ese día.");
  }

  e.next();
}, "bookings");

// Notifica (en la app, sin correo por ahora) a todo RH/Admin/AdminVip de que
// llegó una solicitud nueva.
onRecordAfterCreateSuccess((e) => {
  try {
    const managers = e.app.findRecordsByFilter(
      "users",
      "role = 'rh' || role = 'admin' || role = 'adminvip'",
      "",
      0,
      0,
    );
    const roomName = (() => {
      try {
        return e.app.findRecordById("rooms", e.record.get("room")).get("name");
      } catch (_) {
        return "una sala";
      }
    })();

    for (const manager of managers) {
      const notif = new Record(e.app.findCollectionByNameOrId("notifications"));
      notif.set("recipient", manager.id);
      notif.set("booking", e.record.id);
      notif.set("type", "new_request");
      notif.set(
        "message",
        `Nueva solicitud pendiente para ${roomName} (motivo: ${e.record.get("reason")}).`,
      );
      notif.set("read", false);
      e.app.save(notif);
    }
  } catch (err) {
    console.log("Error creando notificaciones de nueva solicitud:", err);
  }

  e.next();
}, "bookings");

// RH solo puede tocar status/rejection_reason; rechazar exige una razón;
// aprobar vuelve a validar que no exista otra aprobada ese mismo día.
onRecordUpdateRequest((e) => {
  const original = e.record.original();
  const role = e.auth?.get("role");

  if (role === "rh") {
    const guardedFields = ["room", "reason", "start", "end", "people_count", "requester_email", "requested_by"];
    for (const name of guardedFields) {
      if (JSON.stringify(original.get(name)) !== JSON.stringify(e.record.get(name))) {
        throw new BadRequestError("RH solo puede aprobar o rechazar la solicitud.");
      }
    }
  }

  const newStatus = e.record.get("status");

  if (newStatus === "rejected" && !e.record.get("rejection_reason")) {
    throw new BadRequestError("Debes indicar una razón de rechazo.");
  }

  if (newStatus === "approved") {
    e.record.set("rejection_reason", "");

    const room = e.record.get("room");
    const start = e.record.get("start");
    const d = new Date(start);
    const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString()
      .replace("T", " ");
    const dayEnd = new Date(new Date(dayStart.replace(" ", "T")).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ");

    const approvedSameDay = e.app.findRecordsByFilter(
      "bookings",
      "room = {:room} && status = 'approved' && start >= {:dayStart} && start < {:dayEnd} && id != {:id}",
      "",
      1,
      0,
      { room, dayStart, dayEnd, id: e.record.id },
    );
    if (approvedSameDay.length > 0) {
      throw new BadRequestError("Ya hay otra reserva aprobada para esta sala ese día.");
    }
  }

  e.next();
}, "bookings");

// Al aprobar, cualquier otra solicitud pendiente de la misma sala y el mismo
// día se rechaza automáticamente (un día aprobado agota la sala para ese
// día). RH/Admin/AdminVip reciben notificación de cualquier rechazo (manual
// o automático) junto con el motivo.
onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original();
  const status = e.record.get("status");
  const statusChanged = original.get("status") !== status;

  if (statusChanged && status === "rejected") {
    try {
      const managers = e.app.findRecordsByFilter(
        "users",
        "role = 'rh' || role = 'admin' || role = 'adminvip'",
        "",
        0,
        0,
      );
      const roomName = (() => {
        try {
          return e.app.findRecordById("rooms", e.record.get("room")).get("name");
        } catch (_) {
          return "una sala";
        }
      })();

      for (const manager of managers) {
        const notif = new Record(e.app.findCollectionByNameOrId("notifications"));
        notif.set("recipient", manager.id);
        notif.set("booking", e.record.id);
        notif.set("type", "rejected");
        notif.set(
          "message",
          `Solicitud de ${roomName} rechazada. Motivo: ${e.record.get("rejection_reason")}`,
        );
        notif.set("read", false);
        e.app.save(notif);
      }

      const requesterNotif = new Record(e.app.findCollectionByNameOrId("notifications"));
      requesterNotif.set("recipient", e.record.get("requested_by"));
      requesterNotif.set("booking", e.record.id);
      requesterNotif.set("type", "rejected");
      requesterNotif.set(
        "message",
        `Tu solicitud de ${roomName} fue rechazada. Motivo: ${e.record.get("rejection_reason")}`,
      );
      requesterNotif.set("read", false);
      e.app.save(requesterNotif);
    } catch (err) {
      console.log("Error creando notificación de rechazo:", err);
    }
  }

  if (statusChanged && status === "approved") {
    try {
      const roomName = (() => {
        try {
          return e.app.findRecordById("rooms", e.record.get("room")).get("name");
        } catch (_) {
          return "una sala";
        }
      })();

      const requesterNotif = new Record(e.app.findCollectionByNameOrId("notifications"));
      requesterNotif.set("recipient", e.record.get("requested_by"));
      requesterNotif.set("booking", e.record.id);
      requesterNotif.set("type", "approved");
      requesterNotif.set("message", `Tu solicitud de ${roomName} fue aprobada.`);
      requesterNotif.set("read", false);
      e.app.save(requesterNotif);
    } catch (err) {
      console.log("Error creando notificación de aprobación:", err);
    }

    try {
      const room = e.record.get("room");
      const start = e.record.get("start");
      const d = new Date(start);
      const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .replace("T", " ");
      const dayEnd = new Date(new Date(dayStart.replace(" ", "T")).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ");

      const others = e.app.findRecordsByFilter(
        "bookings",
        "room = {:room} && status = 'pending' && start >= {:dayStart} && start < {:dayEnd} && id != {:id}",
        "",
        0,
        0,
        { room, dayStart, dayEnd, id: e.record.id },
      );

      const autoReason =
        "Se aprobó otra solicitud para esta sala en la misma fecha, por lo que ya no está disponible.";

      // No creamos notificación aquí: guardar "other" con status="rejected"
      // vuelve a disparar este mismo hook para ese registro, y el bloque de
      // arriba (statusChanged && status === 'rejected') ya se encarga de
      // notificar. Crearla aquí también duplicaría el aviso.
      for (const other of others) {
        other.set("status", "rejected");
        other.set("rejection_reason", autoReason);
        e.app.save(other);
      }
    } catch (err) {
      console.log("Error al rechazar automáticamente solicitudes del mismo día:", err);
    }
  }

  e.next();
}, "bookings");

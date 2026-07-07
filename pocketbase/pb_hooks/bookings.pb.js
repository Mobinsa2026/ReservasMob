/// <reference path="../pb_data/types.d.ts" />

// El cliente nunca decide quién solicita ni el estado inicial. Una sala solo
// puede tener UNA reserva aprobada por día: si ya hay una aprobada ese día,
// se bloquea la creación. Las solicitudes pendientes del mismo día NO se
// bloquean entre sí (varias personas pueden competir por el mismo día; la
// primera que se apruebe rechaza automáticamente a las demás, ver abajo).
onRecordCreateRequest((e) => {
  e.record.set("requested_by", e.auth.id);
  // El correo ya no lo captura el formulario (se pedía para un correo de
  // confirmación que no se envía); se toma directo de la cuenta autenticada.
  e.record.set("requester_email", e.auth.get("email"));
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

// Cada 5 minutos: cualquier solicitud que siga "pending" y cuya fecha/hora de
// inicio ya pasó se rechaza automáticamente por falta de respuesta. Se guarda
// con $app.save (no vía request), lo que dispara igualmente el hook
// onRecordAfterUpdateSuccess de abajo y notifica al solicitante y a
// RH/Admin/AdminVip con el motivo, tal como un rechazo manual.
cronAdd("rejectStaleBookings", "*/5 * * * *", () => {
  const nowIso = new Date().toISOString().replace("T", " ");
  const autoReason =
    "Rechazada automáticamente: no hubo respuesta antes de la fecha y hora solicitada.";

  const stale = $app.findRecordsByFilter(
    "bookings",
    "status = 'pending' && start < {:now}",
    "",
    0,
    0,
    { now: nowIso },
  );

  for (const booking of stale) {
    try {
      booking.set("status", "rejected");
      booking.set("rejection_reason", autoReason);
      $app.save(booking);
    } catch (err) {
      console.log("Error al rechazar automáticamente solicitud vencida:", booking.id, err);
    }
  }
});

// Notifica (en la app) a todo RH/Admin/AdminVip de que llegó una solicitud
// nueva, y manda un correo real a los destinatarios configurados en la sala
// (campo "notify_emails" de rooms) — esos correos pueden no ser cuentas del
// sistema, solo bandejas donde RH revisa las solicitudes de su sede.
onRecordAfterCreateSuccess((e) => {
  const room = (() => {
    try {
      return e.app.findRecordById("rooms", e.record.get("room"));
    } catch (_) {
      return null;
    }
  })();
  const roomName = room?.get("name") ?? "una sala";

  try {
    const managers = e.app.findRecordsByFilter(
      "users",
      "role = 'rh' || role = 'admin' || role = 'adminvip'",
      "",
      0,
      0,
    );

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

  try {
    const emailsRaw = room?.get("notify_emails") ?? "";
    const emails = emailsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (emails.length > 0) {
      const extraLabels = {
        wants_coffee: "Café",
        wants_cookies: "Galletas",
        wants_water: "Agua",
        wants_snack: "Snack",
      };
      const extrasRequested = Object.keys(extraLabels).filter((key) => e.record.get(key));
      const extrasText = e.record.get("no_extras")
        ? "Nada extra"
        : extrasRequested.length > 0
          ? extrasRequested.map((key) => extraLabels[key]).join(", ")
          : "—";

      // Los campos "start"/"end" se guardan en UTC; se leen con los
      // getters locales (no los "UTC*") para mostrar la hora que la
      // persona realmente eligió, asumiendo que el servidor corre en la
      // misma zona horaria que quienes usan la app (misma oficina).
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
      const pad = (n) => String(n).padStart(2, "0");
      const start = new Date(e.record.get("start"));
      const end = new Date(e.record.get("end"));
      const horario = `${start.getDate()} ${meses[start.getMonth()]} ${start.getFullYear()}, ${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;

      const row = (label, value) => `
        <tr>
          <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#6b7280; font-size:13px; width:130px; vertical-align:top;">${label}</td>
          <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#16264f; font-size:14px; font-weight:600;">${value}</td>
        </tr>`;

      const message = new MailerMessage({
        from: {
          address: e.app.settings().meta.senderAddress,
          name: e.app.settings().meta.senderName,
        },
        to: emails.map((address) => ({ address })),
        subject: `Nueva solicitud de sala: ${roomName}`,
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background:#2a4ba0; padding:20px 24px; border-radius:12px 12px 0 0;">
              <p style="margin:0; color:#ffffff; font-size:17px; font-weight:600;">Nueva solicitud de sala</p>
            </div>
            <div style="border:1px solid #e2e5ec; border-top:none; border-radius:0 0 12px 12px; padding:20px 24px;">
              <p style="margin:0 0 12px; color:#16264f; font-size:15px;">
                Se solicitó <strong>${roomName}</strong>. Entra al sistema para aprobarla o rechazarla.
              </p>
              <table style="width:100%; border-collapse:collapse;">
                ${row("Solicitante", e.record.get("requester_name"))}
                ${row("Horario", horario)}
                ${row("Personas", e.record.get("people_count"))}
                ${row("Motivo", e.record.get("reason"))}
                ${row("Extras", extrasText)}
              </table>
            </div>
            <p style="margin:16px 0 0; text-align:center; color:#9ca3af; font-size:11px;">
              Correo automático del sistema de reservas de salas — no responder.
            </p>
          </div>
        `,
      });
      e.app.newMailClient().send(message);
    }
  } catch (err) {
    console.log("Error enviando correo de nueva solicitud:", err);
  }

  e.next();
}, "bookings");

// RH solo puede tocar status/rejection_reason; rechazar exige una razón;
// aprobar vuelve a validar que no exista otra aprobada ese mismo día.
onRecordUpdateRequest((e) => {
  const original = e.record.original();
  const role = e.auth?.get("role");

  if (role === "rh") {
    const guardedFields = ["room", "reason", "start", "end", "people_count", "requester_email", "requester_name", "requested_by"];
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
  if (newStatus === "rejected") {
    e.record.set("approved_by_name", "");
  }

  if (newStatus === "approved") {
    e.record.set("rejection_reason", "");
    // Se guarda como texto plano (no relación) porque el solicitante no
    // necesariamente tiene permiso para ver el registro de usuario de quien
    // aprobó (RH/Admin no son visibles entre sí vía las reglas de "users").
    e.record.set("approved_by_name", e.auth.get("name") || e.auth.get("email"));

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

    try {
      const requesterEmail = e.record.get("requester_email");
      if (requesterEmail) {
        const roomName = (() => {
          try {
            return e.app.findRecordById("rooms", e.record.get("room")).get("name");
          } catch (_) {
            return "una sala";
          }
        })();

        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const pad = (n) => String(n).padStart(2, "0");
        const start = new Date(e.record.get("start"));
        const end = new Date(e.record.get("end"));
        const horario = `${start.getDate()} ${meses[start.getMonth()]} ${start.getFullYear()}, ${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;

        const row = (label, value) => `
          <tr>
            <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#6b7280; font-size:13px; width:130px; vertical-align:top;">${label}</td>
            <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#16264f; font-size:14px; font-weight:600;">${value}</td>
          </tr>`;

        const message = new MailerMessage({
          from: {
            address: e.app.settings().meta.senderAddress,
            name: e.app.settings().meta.senderName,
          },
          to: [{ address: requesterEmail }],
          subject: `Solicitud rechazada: ${roomName}`,
          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background:#dc2626; padding:20px 24px; border-radius:12px 12px 0 0;">
                <p style="margin:0; color:#ffffff; font-size:17px; font-weight:600;">Solicitud rechazada</p>
              </div>
              <div style="border:1px solid #e2e5ec; border-top:none; border-radius:0 0 12px 12px; padding:20px 24px;">
                <p style="margin:0 0 12px; color:#16264f; font-size:15px;">
                  Tu solicitud de <strong>${roomName}</strong> fue rechazada.
                </p>
                <table style="width:100%; border-collapse:collapse;">
                  ${row("Horario", horario)}
                  ${row("Motivo original", e.record.get("reason"))}
                  ${row("Razón de rechazo", e.record.get("rejection_reason"))}
                </table>
              </div>
              <p style="margin:16px 0 0; text-align:center; color:#9ca3af; font-size:11px;">
                Correo automático del sistema de reservas de salas — no responder.
              </p>
            </div>
          `,
        });
        e.app.newMailClient().send(message);
      }
    } catch (err) {
      console.log("Error enviando correo de rechazo:", err);
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
      const requesterEmail = e.record.get("requester_email");
      if (requesterEmail) {
        const roomName = (() => {
          try {
            return e.app.findRecordById("rooms", e.record.get("room")).get("name");
          } catch (_) {
            return "una sala";
          }
        })();

        const extraLabels = {
          wants_coffee: { label: "Café", approvedKey: "coffee_approved" },
          wants_cookies: { label: "Galletas", approvedKey: "cookies_approved" },
          wants_water: { label: "Agua", approvedKey: "water_approved" },
          wants_snack: { label: "Snack", approvedKey: "snack_approved" },
        };
        const extrasRequested = Object.keys(extraLabels).filter((key) => e.record.get(key));
        const extrasText = e.record.get("no_extras")
          ? "Nada extra"
          : extrasRequested.length > 0
            ? extrasRequested
                .map(
                  (key) =>
                    `${extraLabels[key].label} (${e.record.get(extraLabels[key].approvedKey) ? "sí" : "no disponible"})`,
                )
                .join(", ")
            : "—";

        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const pad = (n) => String(n).padStart(2, "0");
        const start = new Date(e.record.get("start"));
        const end = new Date(e.record.get("end"));
        const horario = `${start.getDate()} ${meses[start.getMonth()]} ${start.getFullYear()}, ${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;

        const row = (label, value) => `
          <tr>
            <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#6b7280; font-size:13px; width:130px; vertical-align:top;">${label}</td>
            <td style="padding:10px 0; border-top:1px solid #eef1f9; color:#16264f; font-size:14px; font-weight:600;">${value}</td>
          </tr>`;

        const message = new MailerMessage({
          from: {
            address: e.app.settings().meta.senderAddress,
            name: e.app.settings().meta.senderName,
          },
          to: [{ address: requesterEmail }],
          subject: `Solicitud aprobada: ${roomName}`,
          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
              <div style="background:#059669; padding:20px 24px; border-radius:12px 12px 0 0;">
                <p style="margin:0; color:#ffffff; font-size:17px; font-weight:600;">Solicitud aprobada</p>
              </div>
              <div style="border:1px solid #e2e5ec; border-top:none; border-radius:0 0 12px 12px; padding:20px 24px;">
                <p style="margin:0 0 12px; color:#16264f; font-size:15px;">
                  Tu solicitud de <strong>${roomName}</strong> fue aprobada.
                </p>
                <table style="width:100%; border-collapse:collapse;">
                  ${row("Horario", horario)}
                  ${row("Personas", e.record.get("people_count"))}
                  ${row("Motivo", e.record.get("reason"))}
                  ${row("Extras", extrasText)}
                  ${row("Aprobada por", e.record.get("approved_by_name"))}
                </table>
              </div>
              <p style="margin:16px 0 0; text-align:center; color:#9ca3af; font-size:11px;">
                Correo automático del sistema de reservas de salas — no responder.
              </p>
            </div>
          `,
        });
        e.app.newMailClient().send(message);
      }
    } catch (err) {
      console.log("Error enviando correo de aprobación:", err);
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

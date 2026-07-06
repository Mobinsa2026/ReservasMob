/// <reference path="../pb_data/types.d.ts" />

// Todo registro público (o creado por alguien que no sea adminvip) entra
// forzosamente como "corporativo", sin importar lo que mande el cliente.
onRecordCreateRequest((e) => {
  if (!e.hasSuperuserAuth() && e.auth?.get("role") !== "adminvip") {
    e.record.set("role", "corporativo");
  }
  e.next();
}, "users");

// Solo un usuario con rol "adminvip" puede cambiar el rol de cualquier
// usuario (incluido otorgar/quitar adminvip). El superusuario de PocketBase
// (panel admin nativo) siempre puede, ya que opera fuera del sistema de roles
// de la app.
onRecordUpdateRequest((e) => {
  const original = e.record.original();
  const oldRole = original.get("role");
  const newRole = e.record.get("role");

  if (oldRole !== newRole && !e.hasSuperuserAuth() && e.auth?.get("role") !== "adminvip") {
    throw new ForbiddenError("Solo un Admin VIP puede cambiar roles.");
  }

  e.next();
}, "users");

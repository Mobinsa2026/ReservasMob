/// <reference path="../pb_data/types.d.ts" />
// Aprobar/rechazar solicitudes ahora es exclusivo de RH. Admin/AdminVip
// siguen viendo todo (listRule/viewRule sin cambios) pero ya no pueden
// modificar el estado de una solicitud.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  collection.updateRule = "@request.auth.role = 'rh'";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  collection.updateRule =
    "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip'";
  app.save(collection);
});

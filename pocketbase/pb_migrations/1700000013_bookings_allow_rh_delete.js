/// <reference path="../pb_data/types.d.ts" />
// RH ahora también puede eliminar solicitudes (antes solo Admin/AdminVip).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  collection.deleteRule =
    "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip'";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  collection.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'adminvip'";
  app.save(collection);
});

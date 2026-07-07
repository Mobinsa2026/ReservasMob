/// <reference path="../pb_data/types.d.ts" />
// El solicitante ahora puede borrar sus propias solicitudes (por si las envió
// mal o por error), y se guarda el nombre de quién aprobó cada una.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bookings");

  collection.deleteRule =
    "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip' || requested_by = @request.auth.id";

  collection.fields.add(new Field({
    type: "text",
    name: "approved_by_name",
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookings");

  collection.deleteRule =
    "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip'";
  collection.fields.removeByName("approved_by_name");

  app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />
// La migración que agregó el campo "role" nunca actualizó las reglas de
// acceso de la colección "users": se quedó con las reglas por defecto de
// PocketBase (listRule/viewRule/updateRule/deleteRule = "id = @request.auth.id"),
// por lo que AdminVip solo podía verse a sí mismo en la lista de Usuarios.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.listRule = "@request.auth.role = 'adminvip' || @request.auth.role = 'admin'";
  collection.viewRule =
    "@request.auth.role = 'adminvip' || @request.auth.role = 'admin' || id = @request.auth.id";
  collection.updateRule = "@request.auth.role = 'adminvip' || id = @request.auth.id";
  collection.deleteRule = "@request.auth.role = 'adminvip'";

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.updateRule = "id = @request.auth.id";
  collection.deleteRule = "id = @request.auth.id";

  app.save(collection);
});

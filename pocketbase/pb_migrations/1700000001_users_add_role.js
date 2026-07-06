/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new Field({
    type: "select",
    name: "role",
    required: true,
    maxSelect: 1,
    values: ["corporativo", "rh", "admin", "adminvip"],
  }));

  // Admin/AdminVip necesitan ver la lista completa de usuarios (panel de
  // Usuarios); sin esto se queda con la regla por defecto "solo verte a ti
  // mismo".
  collection.listRule = "@request.auth.role = 'adminvip' || @request.auth.role = 'admin'";
  collection.viewRule =
    "@request.auth.role = 'adminvip' || @request.auth.role = 'admin' || id = @request.auth.id";
  collection.updateRule = "@request.auth.role = 'adminvip' || id = @request.auth.id";
  collection.deleteRule = "@request.auth.role = 'adminvip'";
  // Sin esto, el correo de otros usuarios queda oculto (emailVisibility)
  // incluso con listRule/viewRule abiertos.
  collection.manageRule = "@request.auth.role = 'adminvip' || @request.auth.role = 'admin'";

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.removeByName("role");

  app.save(collection);
});

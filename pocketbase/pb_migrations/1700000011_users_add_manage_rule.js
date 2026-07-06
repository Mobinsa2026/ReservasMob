/// <reference path="../pb_data/types.d.ts" />
// Sin manageRule, PocketBase oculta el email de cualquier usuario cuyo
// emailVisibility sea false a menos que seas tú mismo o superusuario — por
// eso Admin/AdminVip veían las filas en Usuarios pero sin correo. manageRule
// les da acceso "de gestión" (ver/editar campos protegidos) sobre cualquier
// registro de la colección.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.manageRule = "@request.auth.role = 'adminvip' || @request.auth.role = 'admin'";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.manageRule = null;
  app.save(collection);
});

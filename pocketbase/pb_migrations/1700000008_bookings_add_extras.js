/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bookings");

  // Lo que el solicitante marca que necesita (o "no_extras" si no requiere nada).
  collection.fields.add(new Field({ type: "bool", name: "wants_coffee" }));
  collection.fields.add(new Field({ type: "bool", name: "wants_cookies" }));
  collection.fields.add(new Field({ type: "bool", name: "wants_water" }));
  collection.fields.add(new Field({ type: "bool", name: "wants_snack" }));
  collection.fields.add(new Field({ type: "bool", name: "no_extras" }));

  // Lo que RH/Admin/AdminVip decide que sí se puede cumplir de lo anterior,
  // más un comentario explicando lo que no se pudo (ej. "no hay café").
  collection.fields.add(new Field({ type: "bool", name: "coffee_approved" }));
  collection.fields.add(new Field({ type: "bool", name: "cookies_approved" }));
  collection.fields.add(new Field({ type: "bool", name: "water_approved" }));
  collection.fields.add(new Field({ type: "bool", name: "snack_approved" }));
  collection.fields.add(new Field({ type: "text", name: "extras_comment" }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  for (const name of [
    "wants_coffee",
    "wants_cookies",
    "wants_water",
    "wants_snack",
    "no_extras",
    "coffee_approved",
    "cookies_approved",
    "water_approved",
    "snack_approved",
    "extras_comment",
  ]) {
    collection.fields.removeByName(name);
  }
  app.save(collection);
});

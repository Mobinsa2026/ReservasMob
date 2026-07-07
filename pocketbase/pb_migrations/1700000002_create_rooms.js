/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "rooms",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'adminvip'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'adminvip'",
    deleteRule: "@request.auth.role = 'adminvip'",
    fields: [
      { type: "text", name: "name", required: true, min: 1 },
      { type: "number", name: "capacity" },
      { type: "bool", name: "active" },
      { type: "text", name: "location" },
      { type: "text", name: "notify_emails" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_rooms_name ON rooms (name)"],
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("rooms");
  app.delete(collection);
});

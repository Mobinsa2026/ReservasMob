/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");
  const roomsCollection = app.findCollectionByNameOrId("rooms");

  const collection = new Collection({
    type: "base",
    name: "bookings",
    // Cualquier usuario autenticado puede ver las reservas ya APROBADAS de
    // cualquiera (necesario para pintar el calendario de disponibilidad),
    // además de sus propias solicitudes en cualquier estado. RH/Admin/AdminVip
    // ven absolutamente todo, incluidas pendientes/rechazadas ajenas.
    listRule:
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'adminvip' || @request.auth.role = 'rh' || requested_by = @request.auth.id || status = 'approved')",
    viewRule:
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'adminvip' || @request.auth.role = 'rh' || requested_by = @request.auth.id || status = 'approved')",
    createRule: "@request.auth.id != ''",
    updateRule:
      "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip'",
    deleteRule:
      "@request.auth.role = 'rh' || @request.auth.role = 'admin' || @request.auth.role = 'adminvip'",
    fields: [
      {
        type: "relation",
        name: "room",
        required: true,
        maxSelect: 1,
        collectionId: roomsCollection.id,
        cascadeDelete: false,
      },
      { type: "text", name: "reason", required: true, min: 1 },
      { type: "date", name: "start", required: true },
      { type: "date", name: "end", required: true },
      { type: "number", name: "people_count", required: true, min: 1 },
      { type: "email", name: "requester_email", required: true },
      {
        type: "relation",
        name: "requested_by",
        required: true,
        maxSelect: 1,
        collectionId: usersCollection.id,
        cascadeDelete: false,
      },
      {
        type: "select",
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["pending", "approved", "rejected"],
      },
      { type: "text", name: "rejection_reason" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookings");
  app.delete(collection);
});

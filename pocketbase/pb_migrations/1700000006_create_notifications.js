/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");
  const bookingsCollection = app.findCollectionByNameOrId("bookings");

  const collection = new Collection({
    type: "base",
    name: "notifications",
    // Solo el destinatario puede ver/marcar como leídas sus propias
    // notificaciones. Se crean únicamente desde los hooks del servidor
    // (createRule/updateRule de creación null = bloqueado vía API pública).
    listRule: "recipient = @request.auth.id",
    viewRule: "recipient = @request.auth.id",
    createRule: null,
    updateRule: "recipient = @request.auth.id",
    deleteRule: "recipient = @request.auth.id",
    fields: [
      {
        type: "relation",
        name: "recipient",
        required: true,
        maxSelect: 1,
        collectionId: usersCollection.id,
        cascadeDelete: true,
      },
      {
        type: "relation",
        name: "booking",
        required: false,
        maxSelect: 1,
        collectionId: bookingsCollection.id,
        cascadeDelete: true,
      },
      { type: "text", name: "message", required: true, min: 1 },
      { type: "bool", name: "read" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  app.delete(collection);
});

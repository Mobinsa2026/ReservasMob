/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  const field = collection.fields.getByName("type");
  field.values = ["new_request", "rejected", "approved"];
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  const field = collection.fields.getByName("type");
  field.values = ["new_request", "rejected"];
  app.save(collection);
});

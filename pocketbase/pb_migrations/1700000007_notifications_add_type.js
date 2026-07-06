/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("notifications");

  collection.fields.add(new Field({
    type: "select",
    name: "type",
    required: true,
    maxSelect: 1,
    values: ["new_request", "rejected"],
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  collection.fields.removeByName("type");
  app.save(collection);
});

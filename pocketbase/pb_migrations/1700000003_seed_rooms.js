/// <reference path="../pb_data/types.d.ts" />
const ROOM_NAMES = ["Sala de juntas F1", "Sala de juntas F2", "Sala de juntas F3"];

migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  for (const name of ROOM_NAMES) {
    const record = new Record(collection);
    record.set("name", name);
    record.set("active", true);
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  for (const name of ROOM_NAMES) {
    try {
      const record = app.findFirstRecordByFilter(collection, "name = {:name}", { name });
      app.delete(record);
    } catch (_) {
      // already removed
    }
  }
});

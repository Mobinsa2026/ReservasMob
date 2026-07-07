/// <reference path="../pb_data/types.d.ts" />
const JUAREZ_ROOMS = ["J2-B2", "K1-Kaeser"];
const JUAREZ_EMAILS = "rhjuarez@mobinsa.com,mgardea@mobinsa.com";

migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  for (const name of JUAREZ_ROOMS) {
    const record = new Record(collection);
    record.set("name", name);
    record.set("active", true);
    record.set("location", "Juárez");
    record.set("notify_emails", JUAREZ_EMAILS);
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  for (const name of JUAREZ_ROOMS) {
    try {
      const record = app.findFirstRecordByFilter(collection, "name = {:name}", { name });
      app.delete(record);
    } catch (_) {
      // already removed
    }
  }
});

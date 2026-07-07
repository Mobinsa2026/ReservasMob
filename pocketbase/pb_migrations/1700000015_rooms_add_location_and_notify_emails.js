/// <reference path="../pb_data/types.d.ts" />
// Cada sala ahora sabe a qué sede pertenece y a qué correos avisar cuando
// llega una solicitud nueva para ella (RH de esa sede). Guardarlo en la sala
// misma (en vez de fijo en el código) permite editar los correos desde el
// panel admin sin tocar hooks ni reiniciar PocketBase.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  collection.fields.add(new Field({ type: "text", name: "location" }));
  collection.fields.add(new Field({
    type: "text",
    name: "notify_emails",
    // Lista separada por comas, ej: "rhchihuahua@mobinsa.com,cborunda@mobinsa.com"
  }));

  app.save(collection);

  const CHIHUAHUA_EMAILS = "rhchihuahua@mobinsa.com,cborunda@mobinsa.com,jcordero@mobinsa.com";
  const existingRooms = app.findRecordsByFilter("rooms", "", "", 0, 0);
  for (const room of existingRooms) {
    room.set("location", "Chihuahua");
    room.set("notify_emails", CHIHUAHUA_EMAILS);
    app.save(room);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("rooms");
  collection.fields.removeByName("location");
  collection.fields.removeByName("notify_emails");
  app.save(collection);
});

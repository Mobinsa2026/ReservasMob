import PocketBase from "pocketbase";

// Sin VITE_PB_URL (build de producción servida por la misma PocketBase),
// usamos el origen absoluto actual (ej. http://192.168.1.40:8090). Una cadena
// vacía se resolvería relativo a la ruta actual del navegador (rompe en
// /login, /register, etc.), así que evitamos esa ambigüedad a propósito.
export const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || window.location.origin,
);

pb.autoCancellation(false);

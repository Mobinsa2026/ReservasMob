import { useCallback, useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import type { Booking } from "../lib/types";

export function useBookings(scope: "mine" | "all") {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const userId = pb.authStore.record?.id;
    const filter =
      scope === "mine" && userId ? pb.filter("requested_by = {:id}", { id: userId }) : "";

    const list = await pb.collection("bookings").getFullList<Booking>({
      filter,
      sort: "-created",
      expand: "room,requested_by",
    });
    setBookings(list);
  }, [scope]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));

    const unsubscribePromise = pb.collection("bookings").subscribe<Booking>("*", () => {
      load();
    });

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  }, [load]);

  // Aplica un cambio de inmediato en el estado local (sin esperar refetch ni
  // el evento realtime, que puede tardar) para que la UI refleje al instante
  // acciones como aprobar/rechazar.
  const patchLocal = useCallback((id: string, patch: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  return { bookings, loading, reload: load, patchLocal };
}

import { useCallback, useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import type { Booking } from "../lib/types";

/** Reservas visibles para el salón indicado: aprobadas de cualquiera (para
 * bloquear el calendario) + las propias del usuario en cualquier estado. */
export function useRoomAvailability(roomId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!roomId) {
      setBookings([]);
      return;
    }
    const list = await pb.collection("bookings").getFullList<Booking>({
      filter: pb.filter("room = {:room} && status != 'rejected'", { room: roomId }),
      sort: "start",
    });
    setBookings(list);
  }, [roomId]);

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

  return { bookings, loading };
}

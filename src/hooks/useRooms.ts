import { useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import type { Room } from "../lib/types";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    pb.collection("rooms")
      .getFullList<Room>({ filter: "active = true", sort: "name" })
      .then((list) => {
        if (active) setRooms(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { rooms, loading };
}

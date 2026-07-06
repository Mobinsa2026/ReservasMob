import { useCallback, useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import type { AppNotification } from "../lib/types";

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    const list = await pb.collection("notifications").getFullList<AppNotification>({
      sort: "-created",
    });
    setNotifications(list);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    load().finally(() => setLoading(false));

    const unsubscribePromise = pb.collection("notifications").subscribe<AppNotification>("*", () => {
      load();
    });

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  }, [enabled, load]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await pb.collection("notifications").update(id, { read: true });
    } catch {
      load();
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(
      unread.map((n) => pb.collection("notifications").update(n.id, { read: true }).catch(() => {})),
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
}

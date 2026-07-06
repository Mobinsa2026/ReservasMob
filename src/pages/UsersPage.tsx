import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { pb } from "../lib/pocketbase";
import { canAssignRoles, ROLE_LABELS } from "../lib/types";
import type { Role, UserRecord } from "../lib/types";
import { Alert } from "../components/ui/Alert";

const ALL_ROLES: Role[] = ["corporativo", "rh", "admin", "adminvip"];

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canEdit = user ? canAssignRoles(user.role) : false;

  useEffect(() => {
    pb.collection("users")
      .getFullList<UserRecord>({ sort: "email" })
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: Role) {
    setError(null);
    const previous = users;
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await pb.collection("users").update(id, { role });
    } catch {
      setUsers(previous);
      setError("No se pudo cambiar el rol.");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Usuarios
      </h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        {canEdit
          ? "Como Admin VIP puedes asignar o cambiar el rol de cualquier usuario."
          : "Lista de usuarios registrados en el sistema."}
      </p>

      <Alert variant="error" className="mb-4" message={error} />

      {loading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">{u.email}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {u.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as Role)}
                        className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

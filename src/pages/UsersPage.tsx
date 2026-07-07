import { useEffect, useState } from "react";
import { Pencil, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { pb } from "../lib/pocketbase";
import { canAssignRoles, ROLE_LABELS } from "../lib/types";
import type { Role, UserRecord } from "../lib/types";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";

const ALL_ROLES: Role[] = ["corporativo", "rh", "admin", "adminvip"];

const ROLE_BADGE: Record<Role, string> = {
  corporativo:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  rh: "bg-electric-50 text-electric-700 dark:bg-electric-500/15 dark:text-electric-300",
  admin: "bg-royal-50 text-royal-700 dark:bg-royal-500/15 dark:text-royal-300",
  adminvip:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const AVATAR_PALETTE = [
  "bg-royal-100 text-royal-700 dark:bg-royal-500/20 dark:text-royal-300",
  "bg-electric-100 text-electric-700 dark:bg-electric-500/20 dark:text-electric-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
];

function avatarClass(seed: string) {
  const idx = seed.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canEdit = user ? canAssignRoles(user.role) : false;

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  function openEdit(u: UserRecord) {
    setEditingUser(u);
    setEditName(u.name ?? "");
    setEditEmail(u.email);
    setEditPassword("");
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingUser) return;
    if (!editEmail.trim()) {
      setEditError("El correo no puede quedar vacío.");
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setEditError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setEditError(null);
    setEditLoading(true);
    try {
      const payload: Record<string, string> = {
        name: editName.trim(),
        email: editEmail.trim(),
      };
      if (editPassword) {
        payload.password = editPassword;
        payload.passwordConfirm = editPassword;
      }
      const updated = await pb.collection("users").update<UserRecord>(editingUser.id, payload);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
    } catch {
      setEditError("No se pudo guardar. Verifica que el correo no esté en uso.");
    } finally {
      setEditLoading(false);
    }
  }

  async function deleteUser(id: string) {
    setError(null);
    setDeleteLoading(true);
    try {
      await pb.collection("users").delete(id);
      setUsers((list) => list.filter((u) => u.id !== id));
      setConfirmingDeleteId(null);
    } catch {
      setError("No se pudo eliminar el usuario.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-sm shadow-royal-900/20">
          <UsersIcon size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Usuarios
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {canEdit && <ShieldCheck size={14} className="text-amber-500" />}
            {canEdit
              ? "Como Admin VIP puedes editar, eliminar o cambiar el rol de cualquier usuario."
              : "Lista de usuarios registrados en el sistema."}
          </p>
        </div>
      </div>

      <Alert variant="error" className="mb-4" message={error} />

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-soft dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  {canEdit && <th className="px-4 py-3 font-medium">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarClass(u.email)}`}
                        >
                          {u.email.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                            {u.name || u.email}
                          </p>
                          {u.name && (
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {u.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors hover:border-neutral-400 focus:border-electric-500 focus:ring-4 focus:ring-electric-500/10 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[u.role]}`}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        {confirmingDeleteId === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 dark:text-red-400">¿Seguro?</span>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteUser(u.id)}
                              loading={deleteLoading}
                            >
                              Sí
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingDeleteId(null)}
                              disabled={deleteLoading}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              aria-label="Editar usuario"
                              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-royal-700 dark:hover:bg-neutral-800 dark:hover:text-royal-300"
                            >
                              <Pencil size={15} />
                            </button>
                            {u.id !== user?.id && (
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteId(u.id)}
                                aria-label="Eliminar usuario"
                                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <Modal title="Editar usuario" onClose={() => setEditingUser(null)}>
          <div className="space-y-4">
            <Input label="Nombre" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input
              label="Correo"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <Input
              label="Nueva contraseña (opcional)"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Déjalo en blanco para no cambiarla"
            />
            <Alert variant="error" message={editError} />
            <div className="flex gap-2">
              <Button onClick={saveEdit} loading={editLoading}>
                Guardar
              </Button>
              <Button variant="ghost" onClick={() => setEditingUser(null)} disabled={editLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

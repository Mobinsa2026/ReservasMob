import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { canManageUsers, ROLE_LABELS } from "../../lib/types";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-royal-50 text-royal-700 dark:bg-royal-500/15 dark:text-royal-300"
      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
  }`;

export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      <NavLink to="/" end className={navItemClass} onClick={() => setOpen(false)}>
        <ClipboardList size={18} /> Solicitudes
      </NavLink>
      <NavLink to="/bookings/new" className={navItemClass} onClick={() => setOpen(false)}>
        <PlusCircle size={18} /> Nueva solicitud
      </NavLink>
      <NavLink to="/availability" className={navItemClass} onClick={() => setOpen(false)}>
        <CalendarDays size={18} /> Disponibilidad
      </NavLink>
      {canManageUsers(user.role) && (
        <NavLink to="/users" className={navItemClass} onClick={() => setOpen(false)}>
          <Users size={18} /> Usuarios
        </NavLink>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80 md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar de escritorio */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white py-5 dark:border-neutral-800 dark:bg-neutral-950 md:flex">
          <div className="flex items-center justify-between px-4 pb-6">
            <Logo />
            <NotificationBell />
          </div>
          {nav}
          <UserFooter email={user.email} role={ROLE_LABELS[user.role]} onLogout={logout} />
        </aside>

        {/* Overlay + panel deslizante móvil */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden ${
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white py-5 transition-transform duration-200 ease-out dark:border-neutral-800 dark:bg-neutral-950 md:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 pb-6">
            <Logo />
            <button
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          </div>
          {nav}
          <UserFooter email={user.email} role={ROLE_LABELS[user.role]} onLogout={logout} />
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl animate-[fadeIn_0.25s_ease-out]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function UserFooter({
  email,
  role,
  onLogout,
}: {
  email: string;
  role: string;
  onLogout: () => void;
}) {
  return (
    <div className="mt-auto border-t border-neutral-200 px-4 pt-4 dark:border-neutral-800">
      <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {email}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{role}</p>
      <button
        onClick={onLogout}
        className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}

import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50 dark:bg-neutral-950">
      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">404</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Página no encontrada.</p>
      <Link to="/" className="text-sm font-medium text-royal-600 dark:text-royal-400">
        Volver al inicio
      </Link>
    </div>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { ClientResponseError } from "pocketbase";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err instanceof ClientResponseError && err.status === 0) {
        setError(
          "No se pudo conectar con el servidor. Verifica que tu dispositivo esté en la misma red y que la app siga encendida en la otra computadora.",
        );
      } else {
        setError("Correo o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-app-gradient flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm animate-[scaleIn_0.25s_ease-out] rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft-lg sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Iniciar sesión
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Ingresa tus datos para acceder al sistema de reservas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo"
            icon={<Mail size={16} />}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            icon={<Lock size={16} />}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Alert variant="error" message={error} />
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";
import { ClientResponseError } from "pocketbase";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      navigate("/");
    } catch (err) {
      if (err instanceof ClientResponseError && err.status === 0) {
        setError(
          "No se pudo conectar con el servidor. Verifica que tu dispositivo esté en la misma red y que la app siga encendida en la otra computadora.",
        );
      } else {
        setError("No se pudo crear la cuenta. Verifica los datos.");
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
          Crear cuenta
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Regístrate para solicitar salas de juntas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            icon={<User size={16} />}
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Alert variant="error" message={error} />
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-medium text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

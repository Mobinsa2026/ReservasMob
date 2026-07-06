import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    } catch {
      setError("No se pudo crear la cuenta. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm animate-[fadeIn_0.25s_ease-out] rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Crear cuenta
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Correo"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Alert variant="error" message={error} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-royal-600 dark:text-royal-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

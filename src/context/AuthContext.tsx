import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { pb } from "../lib/pocketbase";
import type { UserRecord } from "../lib/types";

interface AuthContextValue {
  user: UserRecord | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    (pb.authStore.record as UserRecord | null) ?? null,
  );

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setUser((pb.authStore.record as UserRecord | null) ?? null);
    });
  }, []);

  async function login(email: string, password: string) {
    await pb.collection("users").authWithPassword(email, password);
  }

  async function register(email: string, password: string, name: string) {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    await pb.collection("users").authWithPassword(email, password);
  }

  function logout() {
    pb.authStore.clear();
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

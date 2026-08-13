import { createContext, useContext } from "react";
import type { Role } from "../lib/token";
import type { LoginInput, RegisterInput, User } from "./authApi";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** True while the stored token is being exchanged for a user on first load. */
  isBootstrapping: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

// Kept in its own module so AuthProvider.tsx exports only a component and Fast
// Refresh keeps working.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

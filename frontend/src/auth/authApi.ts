import { apiRequest } from "../lib/api";
import type { Role } from "../lib/token";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// auth: false on both — see the note in api.ts. A 401 here is "wrong password",
// not "your session expired", and must not trigger the sign-out path.
export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
}

/**
 * Registration always creates a CUSTOMER — the backend hardcodes the default
 * and offers no way to ask for a different role, which is why there is no role
 * selector in the form. Admins are promoted directly in the database.
 */
export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

/**
 * Rehydrates the session on boot. Doubles as the token's validity check: an
 * expired or tampered token comes back 401, which clears the session.
 */
export function fetchMe(): Promise<User> {
  return apiRequest<{ user: User }>("/api/users/me").then((res) => res.user);
}

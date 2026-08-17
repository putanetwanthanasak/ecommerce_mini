import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, setUnauthorizedHandler } from "../lib/api";
import { clearStoredToken, getStoredToken, isTokenExpired, storeToken } from "../lib/token";
import { fetchMe, login, register, type LoginInput, type RegisterInput } from "./authApi";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Read localStorage once, synchronously, so the first render already knows
  // whether a session might exist. An obviously-dead token is dropped here
  // rather than costing a round trip just to be told 401.
  const [token, setToken] = useState<string | null>(() => {
    const stored = getStoredToken();
    if (!stored) return null;
    if (isTokenExpired(stored)) {
      clearStoredToken();
      return null;
    }
    return stored;
  });

  const endSession = useCallback(() => {
    clearStoredToken();
    setToken(null);
    // Drop every cached response, not just the user. Anything fetched under the
    // old identity must not be visible to whoever logs in next.
    queryClient.clear();
  }, [queryClient]);

  // Any authenticated request that comes back 401 ends the session. Registered
  // once, here, so a token that expires mid-session is handled the same way no
  // matter which call happened to notice.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(() => {});
  }, [endSession]);

  // Keyed by token so a new login refetches rather than reusing the old user.
  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: fetchMe,
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  });

  const signIn = useCallback(
    async (input: LoginInput) => {
      const result = await login(input);
      storeToken(result.token);
      // Seed the cache before flipping the token so the query mounts with data
      // already present — no loading flash between login and the home page.
      queryClient.setQueryData(["me", result.token], result.user);
      setToken(result.token);
    },
    [queryClient]
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const result = await register(input);
      storeToken(result.token);
      queryClient.setQueryData(["me", result.token], result.user);
      setToken(result.token);
    },
    [queryClient]
  );

  const user = meQuery.data ?? null;

  // A 401 during bootstrap already cleared the token via the handler above, so
  // anything still failing here is a transport or server problem. Surfacing it
  // as an error screen avoids bouncing someone to /login — and implying their
  // credentials are the problem — when the backend is simply down.
  const bootstrapError =
    token !== null &&
    meQuery.isError &&
    !(meQuery.error instanceof ApiError && meQuery.error.status === 401)
      ? meQuery.error
      : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isBootstrapping: token !== null && meQuery.isPending,
      signIn,
      signUp,
      logout: endSession,
    }),
    [user, token, meQuery.isPending, signIn, signUp, endSession]
  );

  if (bootstrapError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md surface p-8 text-center">
          <h1 className="text-row font-semibold text-ink">Can't load your session</h1>
          <p className="mt-2 text-meta text-ink-muted">
            {bootstrapError instanceof Error ? bootstrapError.message : "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => void meQuery.refetch()}
            className="mt-6 w-full rounded-control bg-ink px-4 py-2.5 text-meta font-medium text-board transition hover:bg-ink-muted"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

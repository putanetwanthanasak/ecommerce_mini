import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../auth/authContext";
import { ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { SubmitButton } from "../components/SubmitButton";

const FIELDS = ["email", "password"];

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // No navigate() on success: signIn flips the session state, and GuestOnlyRoute
  // redirects out of /login on the next render. One source of truth for "where
  // does a signed-in user belong", instead of two that can race.
  const mutation = useMutation({ mutationFn: signIn });

  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner error={mutation.error} handledFields={FIELDS} />

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <SubmitButton pending={mutation.isPending}>Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}

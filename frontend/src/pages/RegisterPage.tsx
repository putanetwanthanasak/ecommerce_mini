import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../auth/authContext";
import { ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { SubmitButton } from "../components/SubmitButton";

const FIELDS = ["name", "email", "password"];

/**
 * There is deliberately no role selector.
 *
 * POST /api/auth/register always creates a CUSTOMER — the backend never reads a
 * role off the request body, so any control here would be decorative and would
 * imply a privilege escalation path that doesn't exist. Admins are promoted
 * directly in the database.
 */
export function RegisterPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({ mutationFn: signUp });

  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ name, email, password });
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Takes about ten seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner error={mutation.error} handledFields={FIELDS} />

        <FormField
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <SubmitButton pending={mutation.isPending}>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}

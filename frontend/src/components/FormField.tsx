import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  /** Field-level message from the backend's validation `details` array. */
  error?: string;
}

export function FormField({ label, name, error, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="rail block">
        {label}
      </label>
      <input
        {...inputProps}
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        // The invalid border is kept as well as aria-invalid: colour alone must
        // not be the only signal, which is why the message below carries it too.
        className={`focus-ring w-full rounded-control border bg-board px-3 py-2 text-meta text-ink transition placeholder:text-ink-faint ${
          error ? "border-critical" : "border-edge"
        }`}
      />
      {error && (
        <p id={errorId} className="text-meta text-critical">
          {error}
        </p>
      )}
    </div>
  );
}

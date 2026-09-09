import type { InputHTMLAttributes } from "react";
import { AlertCircleIcon } from "./icons";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  /** Field-level message from the backend's validation `details` array. */
  error?: string;
}

/**
 * A labelled input, matching the reference mockup's field: a sentence-case label
 * above an `h-11` white input with a hairline border and a faint shadow, and an
 * alert-icon error line below when the backend flags this field.
 */
export function FormField({ label, name, error, className = "", ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
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
        className={`focus-ring h-11 w-full rounded-control border bg-surface px-3 text-meta text-ink shadow-sm transition placeholder:text-ink-faint ${
          error ? "border-critical" : "border-hairline"
        } ${className}`}
      />
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-meta text-critical">
          <AlertCircleIcon />
          {error}
        </p>
      )}
    </div>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { buttonClass, type ButtonStyleOptions } from "./buttonStyles";

/**
 * The one button.
 *
 * Its look lives in buttonStyles.ts, which that file explains. Use this
 * component whenever the control *does* something, and `buttonClass` directly
 * when the control navigates and therefore has to be a `<Link>`.
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    ButtonStyleOptions {}

export function Button({ variant, size, fullWidth, className, type, ...rest }: ButtonProps) {
  return (
    <button
      // Defaulting to "button" rather than the HTML default of "submit": every
      // accidental form submission in this app would have come from omitting it.
      // SubmitButton passes type="submit" explicitly.
      type={type ?? "button"}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...rest}
    />
  );
}

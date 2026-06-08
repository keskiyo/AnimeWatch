import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  as?: ElementType;
  $variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  to?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-aw-accent text-white hover:bg-[#ff6f66]",
  secondary: "bg-aw-elevated text-aw-text hover:bg-[#373a3c]",
  ghost: "bg-transparent text-aw-text hover:bg-aw-elevated"
};

export function Button({
  as,
  $variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const Component = as ?? "button";

  return (
    <Component
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_CLASSES[$variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

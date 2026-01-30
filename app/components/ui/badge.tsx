import { cn } from "~/lib/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-primary-100 text-primary-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function MembershipStatusBadge({
  status,
}: {
  status: "activa" | "vencida" | "cancelada";
}) {
  const config = {
    activa: { variant: "success" as const, label: "Activa" },
    vencida: { variant: "danger" as const, label: "Vencida" },
    cancelada: { variant: "default" as const, label: "Cancelada" },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}

export function EnrollmentStatusBadge({
  status,
}: {
  status: "inscrito" | "lista_espera" | "cancelado";
}) {
  const config = {
    inscrito: { variant: "success" as const, label: "Inscrito" },
    lista_espera: { variant: "warning" as const, label: "En espera" },
    cancelado: { variant: "default" as const, label: "Cancelado" },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}

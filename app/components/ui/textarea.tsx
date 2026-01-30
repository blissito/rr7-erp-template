import { cn } from "~/lib/utils/cn";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full px-3 py-2 border rounded-lg shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
          "placeholder:text-gray-400 resize-none",
          error
            ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300",
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

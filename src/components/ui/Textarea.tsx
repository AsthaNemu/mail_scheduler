import React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      className,
      rows = 4,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={cn(
            "block w-full rounded-lg border text-sm text-slate-900 transition-colors shadow-sm",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 px-3.5 py-2.5",
            error
              ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
              : "border-slate-300 bg-white hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100",
            disabled && "cursor-not-allowed bg-slate-50 text-slate-500 opacity-70",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-rose-600 animate-in fade-in duration-150">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

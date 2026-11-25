"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/ui/Toast";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    toasts: context.toasts,
    toast: {
      success: context.success,
      error: context.error,
      info: context.info,
      warning: context.warning,
      custom: context.addToast,
    },
    dismissToast: context.dismissToast,
  };
}

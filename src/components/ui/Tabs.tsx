import React from "react";
import { cn } from "@/lib/cn";

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  activeValue?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  activeValue: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  children,
  className,
}) => {
  return (
    <TabsContext.Provider value={{ activeValue: value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 border-b border-slate-200 w-full overflow-x-auto no-scrollbar",
        className
      )}
    >
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  icon,
  badge,
  className,
}) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t-lg -mb-px border-b-2",
        isActive
          ? "border-brand-600 text-brand-600 bg-white"
          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
        className
      )}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "ml-1 px-2 py-0.5 text-xs font-semibold rounded-full",
            isActive
              ? "bg-brand-50 text-brand-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

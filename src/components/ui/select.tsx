"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  labels: Record<string, React.ReactNode>;
  registerLabel: (value: string, label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({
  value,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  disabled,
  children,
}: SelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (disabled) return;
      if (controlledOpen === undefined) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [disabled, controlledOpen, onOpenChange],
  );

  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({});

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setLabels((prev) => (prev[val] === label ? prev : { ...prev, [val]: label }));
  }, []);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, labels, registerLabel }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  hideChevron?: boolean;
  children?: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, hideChevron, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext();
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);

    React.useImperativeHandle(ref, () => triggerRef.current!);

    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-2xs transition-colors hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        {!hideChevron && (
          <svg
            className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-1", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) {
  const { value, labels } = useSelectContext();
  
  if (children !== undefined && children !== null) {
    return <span className="truncate">{children}</span>;
  }
  
  return <span className="truncate">{labels[value] || value || placeholder}</span>;
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  children?: React.ReactNode;
}

export function SelectContent({ className, side = "bottom", align = "start", children, ...props }: SelectContentProps) {
  const { open, setOpen } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.parentElement?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const positionClasses = cn(
    side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
    align === "end" ? "right-0" : "left-0"
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 max-h-60 min-w-[150px] w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 text-zinc-950 shadow-xl animate-in fade-in-0 zoom-in-95",
        positionClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ value, disabled, className, children, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen, registerLabel } = useSelectContext();
  const isSelected = selectedValue === value;

  React.useEffect(() => {
    registerLabel(value, children);
  }, [value, children, registerLabel]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onValueChange(value);
          setOpen(false);
        }
      }}
      className={cn(
        "relative flex w-full select-none items-center rounded-lg py-1.5 pl-6 pr-2 text-xs outline-none transition-colors",
        disabled ? "opacity-40 cursor-not-allowed bg-transparent" : "cursor-pointer hover:bg-zinc-100 hover:text-zinc-900",
        isSelected && "bg-zinc-100 font-semibold text-zinc-900",
        className
      )}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-1.5 flex h-3.5 w-3.5 items-center justify-center text-zinc-900">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageShellProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({ header, children, className }: PageShellProps) {
  return (
    <div
      className={cn("flex-1 min-h-0 px-8 py-4 space-y-4 flex flex-col overflow-hidden", className)}
    >
      {header}
      {children}
    </div>
  );
}

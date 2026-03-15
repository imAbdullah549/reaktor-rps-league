import type { ReactNode } from "react";
import { TypographyH2, TypographyP } from "@/components/ui/typography";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  isUpdating?: boolean;
  actions?: ReactNode;
  kpis?: ReactNode;
};

export function PageHeader({ title, subtitle, isUpdating, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypographyH2 className="mb-1">{title}</TypographyH2>
          {subtitle ? (
            <TypographyP className="text-sm text-muted-foreground">
              {subtitle}
              {isUpdating ? " • Updating…" : null}
            </TypographyP>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

const TypographyH2 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
);
TypographyH2.displayName = "TypographyH2";

const TypographyP = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm leading-7 text-foreground", className)} {...props} />
));
TypographyP.displayName = "TypographyP";

const TypographyMuted = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
TypographyMuted.displayName = "TypographyMuted";

const TypographySmall = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn("text-xs font-medium leading-none text-muted-foreground", className)}
      {...props}
    />
  )
);
TypographySmall.displayName = "TypographySmall";

export { TypographyH2, TypographyP, TypographyMuted, TypographySmall };

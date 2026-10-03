import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-sm dark:shadow-card", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col gap-1 p-5 sm:p-6", className)} {...props} />
);
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("font-display text-base font-semibold tracking-tight sm:text-lg", className)} {...props} />
);
const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
const CardContent = ({ className, ...props }) => <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

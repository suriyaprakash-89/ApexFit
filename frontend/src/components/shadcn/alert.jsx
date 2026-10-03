import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", {
  variants: {
    variant: {
      default: "border-border bg-card text-foreground",
      destructive: "border-destructive/40 bg-destructive/10 text-destructive",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    },
  },
  defaultVariants: { variant: "default" },
});

export const Alert = ({ className, variant, ...props }) => (
  <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);
export const AlertTitle = ({ className, ...props }) => <h5 className={cn("font-semibold leading-none", className)} {...props} />;
export const AlertDescription = ({ className, ...props }) => <div className={cn("text-sm opacity-90", className)} {...props} />;

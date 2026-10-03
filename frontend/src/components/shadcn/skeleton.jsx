import { cn } from "@/lib/utils";

export const Skeleton = ({ className, ...props }) => (
  <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />
);

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export const Toaster = () => {
  const { isDark } = useTheme();
  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      position="top-center"
      offset="max(16px, env(safe-area-inset-top))"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-xl !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
};

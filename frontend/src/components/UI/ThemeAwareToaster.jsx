// frontend/src/components/UI/ThemeAwareToaster.jsx
import { Toaster } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeAwareToaster = () => {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? "#374151" : "#fff",
          color: isDark ? "#fff" : "#374151",
          boxShadow: isDark
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: isDark ? "1px solid #4B5563" : "1px solid #E5E7EB",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
        },
        loading: {
          iconTheme: {
            primary: "#3B82F6",
            secondary: "#fff",
          },
        },
      }}
    />
  );
};

export default ThemeAwareToaster;

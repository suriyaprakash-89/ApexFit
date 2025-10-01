// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("system"); // 'light', 'dark', or 'system'
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem("theme") || "system";
      setTheme(savedTheme);
      applyTheme(savedTheme);
      setIsInitialized(true);
    };

    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e) => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const applyTheme = (themeToApply) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");

    if (themeToApply === "system") {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (systemPrefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.add("light");
      }
    } else {
      html.classList.add(themeToApply);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Simple toggle function for the navbar
  const toggleTheme = () => {
    if (theme === "system") {
      // If system mode, toggle to the opposite of system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const newTheme = systemPrefersDark ? "light" : "dark";
      changeTheme(newTheme);
    } else {
      // If already light or dark, just toggle between them
      const newTheme = theme === "light" ? "dark" : "light";
      changeTheme(newTheme);
    }
  };

  const isDark = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  };

  const value = {
    theme,
    changeTheme,
    toggleTheme,
    isDark: isDark(),
    isInitialized,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
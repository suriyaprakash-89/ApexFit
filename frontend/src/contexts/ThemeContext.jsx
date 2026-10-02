// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const THEMES = ["light", "dark", "system"];
const mediaQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const readSavedTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    return THEMES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
};

const applyTheme = (dark) => {
  const html = document.documentElement;
  html.classList.toggle("dark", dark);
  html.classList.toggle("light", !dark);
  html.style.colorScheme = dark ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  // Read synchronously so the first render already matches the class set in index.html
  const [theme, setTheme] = useState(readSavedTheme); // 'light', 'dark', or 'system'
  const [systemDark, setSystemDark] = useState(() => mediaQuery().matches);

  useEffect(() => {
    const mq = mediaQuery();
    const handleChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const changeTheme = useCallback((newTheme) => {
    if (!THEMES.includes(newTheme)) return;
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this session.
    }
  }, []);

  // Simple toggle for the nav bar: flip whatever is currently visible
  const toggleTheme = useCallback(
    () => changeTheme(isDark ? "light" : "dark"),
    [changeTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

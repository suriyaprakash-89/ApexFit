// frontend/src/components/Auth/AuthLayout.jsx
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const AuthLayout = ({ title, subtitle, children, footer }) => {
  useEffect(() => {
    document.title = `${title} · ApeXfit`;
  }, [title]);

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 bg-gradient-to-br from-primary-50 via-gray-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="" className="w-16 h-16 mx-auto rounded-full shadow-md" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ape<span className="text-primary-600 dark:text-primary-400">X</span>fit
          </p>
        </div>
        <div className="card shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
};

export const PasswordInput = ({ id, label, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input id={id} type={visible ? "text" : "password"} className="input-field pr-12" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

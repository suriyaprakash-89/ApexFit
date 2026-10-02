// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Github } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { AuthLayout, PasswordInput, GoogleIcon } from "../components/Auth/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithProvider } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back!");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back! Let's keep your streak going."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign up
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <p className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-gray-800 text-muted">or continue with</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => handleSocialLogin("google")} className="btn-secondary">
          <GoogleIcon />
          Google
        </button>
        <button type="button" onClick={() => handleSocialLogin("github")} className="btn-secondary">
          <Github className="w-5 h-5" aria-hidden="true" />
          GitHub
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;

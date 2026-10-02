// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { AuthLayout } from "../components/Auth/AuthLayout";

const ForgotPassword = () => {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link."}
      footer={
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-2" role="status">
          <MailCheck className="w-12 h-12 mx-auto text-green-600 dark:text-green-400" aria-hidden="true" />
          <p className="mt-4 font-medium text-gray-900 dark:text-white">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">
            If an account exists for <strong>{email}</strong>, you'll get a link to set a new password.
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
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
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;

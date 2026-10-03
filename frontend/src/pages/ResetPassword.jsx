// frontend/src/pages/ResetPassword.jsx
// Opened from the password-reset email. Supabase signs the user in with a
// temporary recovery session, which lets us call updateUser({ password }).
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "@/lib/toast";
import { useAuthStore } from "../store/authStore";
import { AuthLayout, PasswordInput } from "../components/Auth/AuthLayout";

const MIN_PASSWORD = 8;

const ResetPassword = () => {
  const { session, updatePassword } = useAuthStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters long`);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Password updated. You're all set!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This password reset link is invalid or has expired."
        footer={
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Back to sign in
          </Link>
        }
      >
        <Link to="/forgot-password" className="btn-primary w-full">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it at least 8 characters.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordInput
          id="new-password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

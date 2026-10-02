// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { AuthLayout, PasswordInput } from "../components/Auth/AuthLayout";

const MIN_PASSWORD = 8;

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    weight: "",
    height: "",
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordTooShort = formData.password.length > 0 && formData.password.length < MIN_PASSWORD;
  const mismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters long`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email.trim(), formData.password, {
        name: formData.name.trim(),
        age: formData.age || null,
        weight: formData.weight || null,
        height: formData.height || null,
      });

      toast.success("Account created! Check your email to verify your account.", { duration: 6000 });
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Track your activity, sleep and hydration, with an AI coach on your side."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="input-field"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
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
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            aria-describedby="password-hint"
            value={formData.password}
            onChange={handleChange}
          />
          <p
            id="password-hint"
            className={`mt-1.5 text-xs ${passwordTooShort ? "text-red-600 dark:text-red-400" : "text-muted"}`}
          >
            At least {MIN_PASSWORD} characters.
          </p>
        </div>
        <div>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            required
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "confirm-error" : undefined}
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {mismatch && (
            <p id="confirm-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              Passwords don't match.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="label">
            About you <span className="font-normal text-muted">(optional, helps personalise your coach)</span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "age", label: "Age", step: "1" },
              { name: "weight", label: "Weight (kg)", step: "0.1" },
              { name: "height", label: "Height (cm)", step: "0.1" },
            ].map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="block text-xs text-muted mb-1">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={f.step}
                  className="input-field"
                  value={formData[f.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;

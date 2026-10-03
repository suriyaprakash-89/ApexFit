// frontend/src/pages/Profile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { User, HeartPulse } from "lucide-react";
import toast from "@/lib/toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import Page from "../components/UI/Page";
import { SkeletonCard } from "../components/UI/Skeleton";
import AchievementsCard from "../components/Profile/AchievementsCard";

const bmiCategory = (bmi) => {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600 dark:text-blue-400" };
  if (bmi < 25) return { label: "Healthy weight", color: "text-green-600 dark:text-green-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Obese range", color: "text-red-600 dark:text-red-400" };
};

const Profile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      setProfile(data);
      setDraft(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (navigator.onLine) toast.error("Failed to load profile");
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        name: draft.name?.trim() || null,
        age: draft.age === "" || draft.age == null ? null : parseInt(draft.age, 10),
        weight: draft.weight === "" || draft.weight == null ? null : parseFloat(draft.weight),
        height: draft.height === "" || draft.height == null ? null : parseFloat(draft.height),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      // Keep the auth metadata (used for the greeting/avatar) in sync with the name
      if (updates.name !== user.user_metadata?.name) {
        await supabase.auth.updateUser({ data: { name: updates.name } });
      }
      setProfile({ ...profile, ...updates });
      setDraft({ ...profile, ...updates });
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  if (!profile) {
    return (
      <Page title="Profile" icon={User}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard lines={6} className="lg:col-span-2" />
          <SkeletonCard lines={3} />
        </div>
      </Page>
    );
  }

  const weight = Number(profile.weight);
  const height = Number(profile.height);
  const bmi = weight > 0 && height > 0 ? weight / (height / 100) ** 2 : null;
  const category = bmi ? bmiCategory(bmi) : null;

  const fields = [
    { key: "name", label: "Name", type: "text", autoComplete: "name" },
    { key: "age", label: "Age", type: "number", inputMode: "numeric", min: 1, max: 120 },
    { key: "weight", label: "Weight (kg)", type: "number", inputMode: "decimal", step: "0.1", min: 1 },
    { key: "height", label: "Height (cm)", type: "number", inputMode: "decimal", step: "0.1", min: 1 },
  ];

  return (
    <Page
      title="Profile"
      icon={User}
      subtitle="Your details help personalise your goals and AI coach"
      actions={
        !editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            Edit profile
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="card lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map(({ key, label, ...inputProps }) => (
              <div key={key}>
                <label htmlFor={`profile-${key}`} className="label">
                  {label}
                </label>
                <input
                  id={`profile-${key}`}
                  value={draft[key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  disabled={!editing}
                  className="input-field"
                  {...inputProps}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label htmlFor="profile-email" className="label">
                Email
              </label>
              <input id="profile-email" type="email" value={profile.email} disabled className="input-field" />
            </div>
          </div>

          {editing && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button type="button" onClick={cancel} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </form>

        <section className="card self-start">
          <h2 className="card-title flex items-center gap-2 mb-4">
            <HeartPulse className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            Body mass index
          </h2>
          {bmi ? (
            <>
              <p className="text-4xl font-bold text-foreground">{bmi.toFixed(1)}</p>
              <p className={`mt-1 font-medium ${category.color}`}>{category.label}</p>
              <p className="mt-4 text-sm text-muted">
                BMI is a rough screening number that doesn't account for muscle mass. Use it as one signal among
                many.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Add your weight and height to see your BMI.</p>
          )}
        </section>
      </div>
      <div className="mt-6">
        <AchievementsCard points={profile.points ?? 0} />
      </div>
    </Page>
  );
};

export default Profile;

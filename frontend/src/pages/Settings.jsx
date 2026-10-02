// frontend/src/pages/Settings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Bell, Moon, Sun, Download, Trash2, Shield, Monitor, Settings as SettingsIcon, Palette } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { apiJson } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../contexts/ThemeContext";
import { confirmDialog } from "../store/confirmStore";
import Page from "../components/UI/Page";
import { SkeletonCard } from "../components/UI/Skeleton";
import { localDate } from "../utils/date";

const DEFAULT_SETTINGS = {
  notifications: true,
  water_reminders: true,
  goal_reminders: true,
  weekly_report: true,
};

const Switch = ({ id, label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div>
      <p id={`${id}-label`} className={`font-medium ${disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
        {label}
      </p>
      <p id={`${id}-desc`} className="text-sm text-muted">
        {description}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-desc`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

const Settings = () => {
  const { user, signOut } = useAuthStore();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_SETTINGS);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      const merged = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };
      setSettings(merged);
      setSaved(merged);
    } catch (error) {
      console.error("Error fetching settings:", error);
      if (navigator.onLine) toast.error("Failed to load settings");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const dirty = Object.keys(DEFAULT_SETTINGS).some((k) => settings[k] !== saved[k]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, theme };
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, settings: payload, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      setSaved(settings);
      toast.success("Settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const tables = ["activities", "steps", "sleep", "water", "goals"];
      const results = await Promise.all(tables.map((t) => supabase.from(t).select("*").eq("user_id", user.id)));
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;

      const allData = Object.fromEntries(tables.map((t, i) => [t, results[i].data]));
      allData.exported_at = new Date().toISOString();

      // Blob URLs handle large exports (data: URIs have size limits in some browsers)
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `apexfit_data_${localDate()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success("Your data was downloaded");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    const ok = await confirmDialog({
      title: "Delete your account?",
      message:
        "This permanently deletes your account and all of your activities, goals, sleep, water and AI coach history. This cannot be undone.",
      confirmText: "Delete my account",
      danger: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      // Must run on the server: deleting an auth user needs the service_role key
      await apiJson("/api/account", { method: "DELETE" });
      await signOut().catch(() => {});
      toast.success("Your account has been deleted");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <Page title="Settings" icon={SettingsIcon}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={3} />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Settings" icon={SettingsIcon}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="card">
          <h2 className="card-title flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5" aria-hidden="true" />
            Notifications
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <Switch
              id="set-notifications"
              label="Enable notifications"
              description="Receive app notifications"
              checked={settings.notifications}
              onChange={(v) => setSettings({ ...settings, notifications: v })}
            />
            <Switch
              id="set-water"
              label="Water reminders"
              description="Nudge me when I'm behind on water"
              checked={settings.water_reminders}
              disabled={!settings.notifications}
              onChange={(v) => setSettings({ ...settings, water_reminders: v })}
            />
            <Switch
              id="set-goals"
              label="Goal reminders"
              description="Remind me about my goals"
              checked={settings.goal_reminders}
              disabled={!settings.notifications}
              onChange={(v) => setSettings({ ...settings, goal_reminders: v })}
            />
            <Switch
              id="set-weekly"
              label="Weekly reports"
              description="Send me a weekly progress summary"
              checked={settings.weekly_report}
              onChange={(v) => setSettings({ ...settings, weekly_report: v })}
            />
          </div>
          <button onClick={saveSettings} disabled={saving || !dirty} className="btn-primary w-full mt-4">
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
          </button>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="card-title flex items-center gap-2 mb-1">
              <Palette className="w-5 h-5" aria-hidden="true" />
              Appearance
            </h2>
            <p className="text-sm text-muted mb-4">Applies instantly on this device.</p>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-700">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => changeTheme(value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === value
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title flex items-center gap-2 mb-1">
              <Download className="w-5 h-5" aria-hidden="true" />
              Your data
            </h2>
            <p className="text-sm text-muted mb-4">Download a copy of all your fitness data as JSON.</p>
            <button onClick={exportData} disabled={exporting} className="btn-secondary w-full">
              {exporting ? "Preparing download..." : "Export all data"}
            </button>
          </section>

          <section className="card border-red-200 dark:border-red-900/60">
            <h2 className="card-title flex items-center gap-2 mb-1 text-red-700 dark:text-red-400">
              <Shield className="w-5 h-5" aria-hidden="true" />
              Danger zone
            </h2>
            <p className="text-sm text-muted mb-4">
              Permanently delete your account and all of your data. This cannot be undone.
            </p>
            <button onClick={deleteAccount} disabled={deleting} className="btn-danger w-full">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </section>
        </div>
      </div>
    </Page>
  );
};

export default Settings;

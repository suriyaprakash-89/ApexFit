// frontend/src/pages/Activities.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useActivityStore } from "../store/activityStore";
import { confirmDialog } from "../store/confirmStore";
import { offlineSavedToast } from "../store/syncStore";
import Page from "../components/UI/Page";
import Modal from "../components/UI/Modal";
import EmptyState from "../components/UI/EmptyState";
import { Skeleton } from "../components/UI/Skeleton";
import { ACTIVITY_TYPES, activityEmoji } from "../utils/goals";
import { localDate, formatDate } from "../utils/date";

const emptyForm = () => ({
  type: "running",
  duration: "",
  calories: "",
  distance: "",
  notes: "",
  date: localDate(),
});

const Activities = () => {
  const { user } = useAuthStore();
  const { logActivity, fetchDashboardData } = useActivityStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [editingActivity, setEditingActivity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      if (navigator.onLine) toast.error("Failed to load activities");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // "Log activity" buttons elsewhere link here with ?new=1
  const wantsNew = searchParams.get("new") === "1";
  useEffect(() => {
    if (wantsNew) setShowForm(true);
  }, [wantsNew]);

  const openNew = () => {
    setEditingActivity(null);
    setFormData(emptyForm());
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingActivity(null);
    setFormData(emptyForm());
    if (searchParams.has("new")) setSearchParams({}, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: formData.type,
      duration: parseInt(formData.duration, 10),
      calories: parseInt(formData.calories, 10),
      distance: formData.distance ? parseFloat(formData.distance) : null,
      notes: formData.notes.trim() || null,
      date: formData.date,
    };

    try {
      if (editingActivity) {
        const { error } = await supabase.from("activities").update(payload).eq("id", editingActivity.id);
        if (error) throw error;
        fetchDashboardData();
        toast.success("Activity updated");
      } else {
        const { activity, queued } = await logActivity(payload);
        if (queued) {
          // Offline: show it now, it syncs automatically later
          setActivities((prev) => [{ ...activity, pending: true }, ...prev]);
          offlineSavedToast();
          closeForm();
          return;
        }
        toast.success("Activity added. Nice work! 💪");
      }
      closeForm();
      fetchActivities();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type,
      duration: String(activity.duration),
      calories: String(activity.calories),
      distance: activity.distance?.toString() || "",
      notes: activity.notes || "",
      date: activity.date,
    });
    setShowForm(true);
  };

  const handleDelete = async (activity) => {
    const ok = await confirmDialog({
      title: "Delete activity?",
      message: `This ${activity.type} session from ${formatDate(activity.date)} will be removed permanently.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;

    try {
      const { error } = await supabase.from("activities").delete().eq("id", activity.id);
      if (error) throw error;
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
      fetchDashboardData();
      toast.success("Activity deleted");
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
  });

  const RowActions = ({ activity }) =>
    activity.pending ? (
      <span className="text-xs font-medium text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40 px-2.5 py-1 rounded-full">
        Waiting to sync
      </span>
    ) : (
    <div className="flex gap-1">
      <button
        onClick={() => handleEdit(activity)}
        className="icon-btn"
        aria-label={`Edit ${activity.type} on ${formatDate(activity.date)}`}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(activity)}
        className="icon-btn hover:!text-red-600 dark:hover:!text-red-400"
        aria-label={`Delete ${activity.type} on ${formatDate(activity.date)}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <Page
      title="Activities"
      icon={Activity}
      subtitle="Every workout you've logged"
      actions={
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-5 h-5" aria-hidden="true" />
          Add activity
        </button>
      }
    >
      <div className="card !p-0 overflow-hidden">
        {initialLoading ? (
          <div className="p-5 space-y-4" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activities recorded yet"
            description="Log a run, ride, gym session or yoga class to start building your history."
            action={
              <button onClick={openNew} className="btn-primary">
                Add your first activity
              </button>
            }
          />
        ) : (
          <>
            {/* Phones: cards */}
            <ul className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 p-4">
                  <span className="text-2xl" aria-hidden="true">
                    {activityEmoji(activity.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{activity.type}</p>
                    <p className="text-sm text-muted">
                      {formatDate(activity.date, { month: "short", day: "numeric" })} · {activity.duration} min ·{" "}
                      {activity.calories} cal
                    </p>
                  </div>
                  <RowActions activity={activity} />
                </li>
              ))}
            </ul>

            {/* Tablet & desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="table-head">Activity</th>
                    <th scope="col" className="table-head">Date</th>
                    <th scope="col" className="table-head">Duration</th>
                    <th scope="col" className="table-head">Calories</th>
                    <th scope="col" className="table-head">Distance</th>
                    <th scope="col" className="table-head"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="table-cell">
                        <span className="text-xl mr-2" aria-hidden="true">
                          {activityEmoji(activity.type)}
                        </span>
                        <span className="font-medium capitalize">{activity.type}</span>
                      </td>
                      <td className="table-cell">{formatDate(activity.date)}</td>
                      <td className="table-cell">{activity.duration} min</td>
                      <td className="table-cell">{activity.calories} cal</td>
                      <td className="table-cell">{activity.distance ? `${activity.distance} km` : "–"}</td>
                      <td className="table-cell text-right">
                        <RowActions activity={activity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingActivity ? "Edit activity" : "Add activity"}
        size="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset>
            <legend className="label">Activity type</legend>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  aria-pressed={formData.type === type.value}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[64px] rounded-xl border text-xs font-medium transition-colors ${
                    formData.type === type.value
                      ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {type.emoji}
                  </span>
                  {type.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="act-duration" className="label">
                Duration (min)
              </label>
              <input id="act-duration" type="number" inputMode="numeric" min="1" max="1440" required className="input-field" {...field("duration")} />
            </div>
            <div>
              <label htmlFor="act-calories" className="label">
                Calories burned
              </label>
              <input id="act-calories" type="number" inputMode="numeric" min="0" max="10000" required className="input-field" {...field("calories")} />
            </div>
            <div>
              <label htmlFor="act-distance" className="label">
                Distance (km) <span className="font-normal text-muted">optional</span>
              </label>
              <input id="act-distance" type="number" inputMode="decimal" step="0.1" min="0" className="input-field" {...field("distance")} />
            </div>
            <div>
              <label htmlFor="act-date" className="label">
                Date
              </label>
              <input id="act-date" type="date" max={localDate()} required className="input-field" {...field("date")} />
            </div>
          </div>

          <div>
            <label htmlFor="act-notes" className="label">
              Notes <span className="font-normal text-muted">optional</span>
            </label>
            <textarea
              id="act-notes"
              rows={3}
              maxLength={500}
              className="input-field"
              placeholder="How did it feel?"
              {...field("notes")}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editingActivity ? "Save changes" : "Add activity"}
            </button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Activities;

// frontend/src/pages/Body.jsx
// Weight, body fat and tape measurements over time, with BMI from the profile height.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Minus, Plus, RefreshCw, Ruler, Scale, Trash2 } from "lucide-react";
import toast from "@/lib/toast";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";
import SetupNotice from "../components/UI/SetupNotice";
import TrendChart from "../components/UI/TrendChart";
import { Button } from "@/components/shadcn/button";
import { Input, Textarea } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { useTrainingStore } from "../store/trainingStore";
import { useActivityStore } from "../store/activityStore";
import { useAuthStore } from "../store/authStore";
import { confirmDialog } from "../store/confirmStore";
import { supabase } from "../lib/supabase";
import { formatDate, localDate } from "../utils/date";
import { bmi as calcBmi } from "../utils/training";

const METRICS = [
  { key: "weight_kg", label: "Weight", unit: "kg", lowerIsBetter: null },
  { key: "body_fat_pct", label: "Body fat", unit: "%", lowerIsBetter: true },
  { key: "waist_cm", label: "Waist", unit: "cm", lowerIsBetter: true },
  { key: "chest_cm", label: "Chest", unit: "cm", lowerIsBetter: null },
  { key: "hips_cm", label: "Hips", unit: "cm", lowerIsBetter: null },
];

const FIELDS = [
  { key: "weight_kg", label: "Weight (kg)", min: 20, max: 700, step: "0.1" },
  { key: "body_fat_pct", label: "Body fat (%)", min: 2, max: 70, step: "0.1" },
  { key: "waist_cm", label: "Waist (cm)", min: 20, max: 400, step: "0.1" },
  { key: "chest_cm", label: "Chest (cm)", min: 20, max: 400, step: "0.1" },
  { key: "hips_cm", label: "Hips (cm)", min: 20, max: 400, step: "0.1" },
];

const Delta = ({ value, unit, lowerIsBetter }) => {
  if (value == null) return null;
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" /> no change
      </span>
    );
  }
  const good = lowerIsBetter == null ? null : lowerIsBetter ? rounded < 0 : rounded > 0;
  const Icon = rounded > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${good == null ? "text-muted-foreground" : good ? "text-primary" : "text-ember-400"}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {Math.abs(rounded)} {unit}
    </span>
  );
};

const emptyForm = () => ({ date: localDate(), weight_kg: "", body_fat_pct: "", waist_cm: "", chest_cm: "", hips_cm: "", notes: "" });

const MeasurementDialog = ({ open, onOpenChange, latest }) => {
  const saveBody = useTrainingStore((s) => s.saveBody);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(), weight_kg: latest?.weight_kg ?? "" });
      setError("");
    }
  }, [open, latest]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filled = FIELDS.filter((f) => form[f.key] !== "");
    if (!filled.length) return setError("Enter at least one measurement.");
    const bad = filled.find((f) => Number(form[f.key]) < f.min || Number(form[f.key]) > f.max || Number.isNaN(Number(form[f.key])));
    if (bad) return setError(`${bad.label} should be between ${bad.min} and ${bad.max}.`);
    setSaving(true);
    try {
      await saveBody(form);
      if (form.weight_kg !== "" && form.date === localDate()) {
        // keep the profile (BMI, AI coach context) in step with today's weigh-in; best effort
        const { data } = await supabase.auth.getUser();
        if (data?.user) await supabase.from("profiles").update({ weight: Number(form.weight_kg) }).eq("id", data.user.id);
      }
      toast.success("Measurements saved");
      onOpenChange(false);
    } catch (err) {
      setError(err.message === "setup" ? "Body tracking isn't set up on this project's database yet." : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add measurements</DialogTitle>
          <DialogDescription>Fill in whatever you measured. Saving again on the same day updates that entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div>
            <Label htmlFor="b-date">Date</Label>
            <Input id="b-date" type="date" className="mt-1.5" value={form.date} max={localDate()} onChange={set("date")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.key === "weight_kg" ? "col-span-2" : ""}>
                <Label htmlFor={`b-${f.key}`}>{f.label}</Label>
                <Input
                  id={`b-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  className="mt-1.5"
                  value={form[f.key]}
                  onChange={set(f.key)}
                  autoFocus={f.key === "weight_kg"}
                />
              </div>
            ))}
          </div>
          <div>
            <Label htmlFor="b-notes">Notes (optional)</Label>
            <Textarea id="b-notes" className="mt-1.5" rows={2} maxLength={300} value={form.notes} onChange={set("notes")} />
          </div>
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Body = () => {
  const { body, bodyLoading, bodyError, fetchBody, deleteBody } = useTrainingStore();
  const goals = useActivityStore((s) => s.goals);
  const user = useAuthStore((s) => s.user);
  const [metric, setMetric] = useState("weight_kg");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [heightCm, setHeightCm] = useState(Number(user?.user_metadata?.height) || null);

  useEffect(() => {
    fetchBody();
  }, [fetchBody]);

  // Height lives on the profile
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("height")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data?.height && setHeightCm(Number(data.height)));
  }, [user?.id]);

  const active = METRICS.find((m) => m.key === metric);
  const points = useMemo(
    () =>
      body
        .filter((b) => b[metric] != null)
        .map((b) => ({ date: b.date, value: Number(b[metric]) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [body, metric]
  );

  const latestWith = (key) => body.find((b) => b[key] != null);
  const previousWith = (key) => body.filter((b) => b[key] != null)[1];
  const latestWeight = latestWith("weight_kg");
  const weightGoal = goals.find((g) => g.goal_type === "weight");
  const bmi = calcBmi(latestWeight?.weight_kg, heightCm);

  const goalProgress = useMemo(() => {
    if (!weightGoal || !latestWeight) return null;
    const asc = body.filter((b) => b.weight_kg != null);
    const start = Number(asc[asc.length - 1].weight_kg);
    const now = Number(latestWeight.weight_kg);
    const target = Number(weightGoal.target_value);
    const total = Math.abs(start - target);
    if (total < 0.05) return { pct: 100, remaining: 0, target };
    const moved = start > target ? start - now : now - start;
    return { pct: Math.max(0, Math.min(100, Math.round((moved / total) * 100))), remaining: Math.abs(now - target), target };
  }, [body, weightGoal, latestWeight]);

  const handleDelete = async (entry) => {
    const ok = await confirmDialog({
      title: "Delete this entry?",
      message: `The measurements from ${formatDate(entry.date)} will be removed.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBody(entry.id);
      toast.success("Entry deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addButton = (
    <Button onClick={() => setDialogOpen(true)} disabled={bodyError === "setup"}>
      <Plus aria-hidden="true" /> Add measurements
    </Button>
  );

  const tiles = [
    { key: "weight_kg", label: "Weight", unit: "kg" },
    { key: "body_fat_pct", label: "Body fat", unit: "%" },
    { key: "waist_cm", label: "Waist", unit: "cm" },
  ];

  return (
    <Page title="Body" icon={Scale} eyebrow="Measurements" subtitle="Weight, body fat and measurements over time" actions={addButton}>
      {bodyError === "setup" && <SetupNotice feature="Body tracking" migration="0007_workouts_body_metrics.sql" />}

      {bodyError && bodyError !== "setup" && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{bodyError}</span>
          <Button variant="outline" size="sm" onClick={fetchBody}>
            <RefreshCw aria-hidden="true" /> Retry
          </Button>
        </div>
      )}

      {bodyLoading ? (
        <div className="space-y-4" aria-hidden="true">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : bodyError === "setup" ? null : body.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Ruler}
            title="Track your body changes"
            description="Add your weight (and body fat or tape measurements if you like) to see trends, BMI and progress toward your goal."
            action={addButton}
          />
        </div>
      ) : (
        <>
          <section aria-label="Latest measurements" className="mb-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {tiles.map(({ key, label, unit }) => {
              const latest = latestWith(key);
              const prev = previousWith(key);
              const meta = METRICS.find((m) => m.key === key);
              return (
                <div key={key} className="card !p-4 sm:!p-5">
                  <p className="eyebrow">{label}</p>
                  <p className="stat-number mt-2 text-2xl text-foreground sm:text-3xl">
                    {latest ? Number(latest[key]) : "—"}
                    {latest && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
                  </p>
                  <div className="mt-1 min-h-[1rem]">
                    {latest && prev ? <Delta value={Number(latest[key]) - Number(prev[key])} unit={unit} lowerIsBetter={meta.lowerIsBetter} /> : <span className="text-xs text-muted-foreground">{latest ? formatDate(latest.date, { month: "short", day: "numeric" }) : "Not logged"}</span>}
                  </div>
                </div>
              );
            })}
            <div className="card !p-4 sm:!p-5">
              <p className="eyebrow">BMI</p>
              <p className="stat-number mt-2 text-2xl text-foreground sm:text-3xl">{bmi ? bmi.value : "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {bmi ? (
                  <>
                    {bmi.label}. A general screen only.
                  </>
                ) : (
                  <>
                    Add your height in <Link to="/profile" className="font-semibold text-primary underline-offset-2 hover:underline">Profile</Link>
                  </>
                )}
              </p>
            </div>
          </section>

          {weightGoal && goalProgress && (
            <section className="card mb-6" aria-label="Weight goal">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="card-title">Weight goal · {goalProgress.target} kg</h2>
                  <p className="text-sm text-muted-foreground">
                    {goalProgress.remaining === 0 ? "You reached your goal." : `${Math.round(goalProgress.remaining * 10) / 10} kg to go`}
                  </p>
                </div>
                <span className="stat-number text-2xl text-primary">{goalProgress.pct}%</span>
              </div>
              <Progress className="mt-4 h-2.5" value={goalProgress.pct} aria-label="Weight goal progress" />
            </section>
          )}

          <section className="card mb-6" aria-label="Trend chart">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="card-title">{active.label} over time</h2>
              <Tabs value={metric} onValueChange={setMetric}>
                <TabsList className="max-w-full overflow-x-auto scrollbar-none">
                  {METRICS.map((m) => (
                    <TabsTrigger key={m.key} value={m.key}>
                      {m.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <TrendChart points={points} unit={active.unit} label={active.label} emptyText={`Log ${active.label.toLowerCase()} on two or more days to see a trend.`} />
          </section>

          <section className="card !p-0 overflow-x-auto" aria-label="History">
            <table className="w-full min-w-[560px] text-left">
              <caption className="sr-only">Measurement history</caption>
              <thead className="border-b border-border">
                <tr>
                  <th scope="col" className="table-head">Date</th>
                  {METRICS.map((m) => (
                    <th key={m.key} scope="col" className="table-head text-right">
                      {m.label}
                    </th>
                  ))}
                  <th scope="col" className="table-head"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {body.slice(0, 30).map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <th scope="row" className="table-cell text-left font-medium">{formatDate(entry.date)}</th>
                    {METRICS.map((m) => (
                      <td key={m.key} className="table-cell stat-number text-right text-foreground">
                        {entry[m.key] != null ? Number(entry[m.key]) : <span className="text-muted-foreground">·</span>}
                      </td>
                    ))}
                    <td className="table-cell text-right">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entry)} aria-label={`Delete entry from ${formatDate(entry.date)}`}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <MeasurementDialog open={dialogOpen} onOpenChange={setDialogOpen} latest={latestWeight} />
    </Page>
  );
};

export default Body;

// frontend/src/pages/Workouts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Dumbbell, Flame, Layers, Plus, RefreshCw, Trash2, Trophy } from "lucide-react";
import toast from "@/lib/toast";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";
import SetupNotice from "../components/UI/SetupNotice";
import TrendChart from "../components/UI/TrendChart";
import WorkoutBuilder from "../components/Workouts/WorkoutBuilder";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { useTrainingStore } from "../store/trainingStore";
import { useAuthStore } from "../store/authStore";
import { confirmDialog } from "../store/confirmStore";
import { addDays, formatDate, localDate } from "../utils/date";
import { exerciseTrend, formatKg, formatVolume, personalRecords, totalVolume } from "../utils/training";

const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="card !p-4 sm:!p-5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="eyebrow whitespace-nowrap !text-[10px] !tracking-[0.1em] sm:!text-[11px] sm:!tracking-[0.14em]">{label}</span>
    </div>
    <p className="stat-number mt-2 text-2xl text-foreground sm:text-3xl">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const WorkoutCard = ({ workout, onDelete }) => {
  const [open, setOpen] = useState(false);
  const volume = totalVolume(workout.sets);
  const byExercise = useMemo(() => {
    const map = new Map();
    workout.sets.forEach((s) => map.set(s.exercise, [...(map.get(s.exercise) || []), s]));
    return Array.from(map.entries());
  }, [workout.sets]);

  return (
    <li className="card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40 sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Dumbbell className="h-5 w-5 text-primary" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display font-semibold text-foreground">{workout.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {formatDate(workout.date, { weekday: "short", month: "short", day: "numeric" })}
            {workout.duration_min ? ` · ${workout.duration_min} min` : ""} · {byExercise.length} exercise{byExercise.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="hidden text-right sm:block">
          <span className="stat-number block text-foreground">{formatVolume(volume)}</span>
          <span className="text-xs text-muted-foreground">{workout.sets.length} sets</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border p-4 sm:p-5">
          {byExercise.map(([exercise, sets]) => (
            <div key={exercise}>
              <p className="text-sm font-semibold text-foreground">{exercise}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {sets.map((s) => (
                  <li key={s.id} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                    <span className="stat-number">{s.reps}</span> × <span className="stat-number">{formatKg(Number(s.weight_kg))}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {workout.notes && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{workout.notes}</p>}
          <div className="flex items-center justify-between sm:hidden">
            <span className="text-sm text-muted-foreground">Volume {formatVolume(volume)}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(workout)}>
            <Trash2 aria-hidden="true" /> Delete workout
          </Button>
        </div>
      )}
    </li>
  );
};

const Workouts = () => {
  const { workouts, sets, workoutsLoading, workoutsError, fetchWorkouts, deleteWorkout } = useTrainingStore();
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const [builderOpen, setBuilderOpen] = useState(params.get("new") === "1");
  const [exercise, setExercise] = useState("");

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // ?new=1 (dashboard quick action) opens the builder once, then cleans the URL
  useEffect(() => {
    if (params.get("new") === "1") {
      setBuilderOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const weekAgo = localDate(addDays(new Date(), -6));
  const week = workouts.filter((w) => w.date >= weekAgo);
  const weekVolume = week.reduce((sum, w) => sum + totalVolume(w.sets), 0);
  const records = useMemo(() => personalRecords(sets), [sets]);
  const exercisesWithData = records.map((r) => r.exercise);
  const activeExercise = exercise || exercisesWithData[0] || "";
  const trend = useMemo(() => exerciseTrend(sets, activeExercise), [sets, activeExercise]);

  const handleDelete = async (workout) => {
    const ok = await confirmDialog({
      title: "Delete this workout?",
      message: `"${workout.name}" and its ${workout.sets.length} sets will be removed. Personal records are recalculated.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteWorkout(workout);
      toast.success("Workout deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logButton = (
    <Button onClick={() => setBuilderOpen(true)} disabled={workoutsError === "setup"}>
      <Plus aria-hidden="true" /> Log workout
    </Button>
  );

  return (
    <Page title="Workouts" icon={Dumbbell} eyebrow="Strength" subtitle="Sets, reps, weight and personal records" actions={logButton}>
      {workoutsError === "setup" && <SetupNotice feature="Workout tracking" migration="0007_workouts_body_metrics.sql" />}

      {workoutsError && workoutsError !== "setup" && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{workoutsError}</span>
          <Button variant="outline" size="sm" onClick={fetchWorkouts}>
            <RefreshCw aria-hidden="true" /> Retry
          </Button>
        </div>
      )}

      {workoutsLoading ? (
        <div className="space-y-4" aria-hidden="true">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : workoutsError === "setup" ? null : workouts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Dumbbell}
            title="Log your first workout"
            description="Add exercises, sets, reps and weight. ApeXfit tracks your volume and flags every new personal record."
            action={logButton}
          />
        </div>
      ) : (
        <>
          <section aria-label="This week" className="mb-6 grid grid-cols-3 gap-3 sm:gap-5">
            <Stat icon={Flame} label="Sessions" value={week.length} hint="last 7 days" />
            <Stat icon={Layers} label="Volume" value={formatVolume(weekVolume)} hint="last 7 days" />
            <Stat icon={Trophy} label="Records" value={records.length} hint="exercises tracked" />
          </section>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <ul className="space-y-3">
                {workouts.slice(0, 40).map((w) => (
                  <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="records">
              <div className="card !p-0 overflow-x-auto">
                <table className="w-full min-w-[400px] text-left">
                  <caption className="sr-only">Personal records by exercise</caption>
                  <thead className="border-b border-border">
                    <tr>
                      <th scope="col" className="table-head">Exercise</th>
                      <th scope="col" className="table-head text-right">Est. 1RM</th>
                      <th scope="col" className="table-head text-right">Best set</th>
                      <th scope="col" className="table-head hidden text-right sm:table-cell">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.exercise} className="border-b border-border last:border-0">
                        <th scope="row" className="table-cell text-left font-medium">
                          {r.exercise} {i === 0 && <Badge className="ml-1.5">Top lift</Badge>}
                        </th>
                        <td className="table-cell stat-number text-right text-primary">{r.best1RM ? formatKg(Math.round(r.best1RM * 10) / 10) : "Bodyweight"}</td>
                        <td className="table-cell text-right">
                          {r.maxWeight ? `${formatKg(r.maxWeight)} × ${r.maxWeightReps}` : `${r.maxWeightReps} reps`}
                        </td>
                        <td className="table-cell stat-number hidden text-right text-muted-foreground sm:table-cell">{r.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Estimated 1RM uses the Epley formula (weight × (1 + reps ÷ 30)). Treat it as a guide, not a max-out target.</p>
            </TabsContent>

            <TabsContent value="progress">
              <div className="card">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="card-title">Strength progression</h2>
                    <p className="text-sm text-muted-foreground">Best estimated 1RM per session</p>
                  </div>
                  <div className="sm:w-60">
                    <Select value={activeExercise} onValueChange={setExercise}>
                      <SelectTrigger aria-label="Exercise to chart">
                        <SelectValue placeholder="Choose exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercisesWithData.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <TrendChart points={trend} unit="kg" label="Est. 1RM" emptyText="Log this lift in two or more sessions to see your progression." />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <WorkoutBuilder open={builderOpen} onOpenChange={setBuilderOpen} bodyWeightKg={Number(user?.user_metadata?.weight) || undefined} />
    </Page>
  );
};

export default Workouts;

// frontend/src/components/Workouts/WorkoutBuilder.jsx
// Log a strength session: exercises, sets (reps x kg), session timer and a rest timer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Dumbbell, Pause, Play, Plus, Timer, Trash2, X } from "lucide-react";
import toast from "@/lib/toast";
import { Button } from "@/components/shadcn/button";
import { Input, Textarea } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";
import { EXERCISE_LIBRARY, REST_PRESETS, formatKg } from "../../utils/training";
import { localDate } from "../../utils/date";
import { useTrainingStore } from "../../store/trainingStore";

const CUSTOM = "__custom__";
const blankSet = (from) => ({ id: crypto.randomUUID?.() || String(Math.random()), reps: from?.reps ?? "", weight_kg: from?.weight_kg ?? "", done: false });
const blankExercise = () => ({ id: crypto.randomUUID?.() || String(Math.random()), name: "", custom: false, sets: [blankSet()] });

const mmss = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** Count-down rest timer with presets; announces completion with a toast and a short vibration. */
const RestTimer = ({ preset, onPreset, running, left, onToggle, onStop }) => (
  <div className="rounded-2xl border border-border bg-card p-3" role="group" aria-label="Rest timer">
    <div className="flex items-center gap-3">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", running ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Timer className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Rest</p>
        <p className="stat-number text-2xl text-foreground" aria-live="off">
          {mmss(running || left > 0 ? left : preset)}
        </p>
      </div>
      <Button type="button" size="sm" variant={running ? "secondary" : "default"} onClick={onToggle} aria-label={running ? "Pause rest timer" : "Start rest timer"}>
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {running ? "Pause" : "Start"}
      </Button>
      {(running || left > 0) && (
        <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={onStop} aria-label="Reset rest timer">
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {REST_PRESETS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPreset(s)}
          aria-pressed={preset === s}
          className={cn(
            "min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors",
            preset === s ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {s >= 60 ? `${s / 60 === Math.floor(s / 60) ? s / 60 : (s / 60).toFixed(1)} min` : `${s}s`}
        </button>
      ))}
    </div>
  </div>
);

const WorkoutBuilder = ({ open, onOpenChange, bodyWeightKg }) => {
  const saveWorkout = useTrainingStore((s) => s.saveWorkout);
  const history = useTrainingStore((s) => s.sets);

  const [name, setName] = useState("");
  const [date, setDate] = useState(localDate());
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [durationTouched, setDurationTouched] = useState(false);
  const [exercises, setExercises] = useState(() => [blankExercise()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Rest timer
  const [preset, setPreset] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  const [restRunning, setRestRunning] = useState(false);

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setName("");
    setDate(localDate());
    setNotes("");
    setDuration("");
    setDurationTouched(false);
    setExercises([blankExercise()]);
    setError("");
    setRestRunning(false);
    setRestLeft(0);
    startedAt.current = Date.now();
    setElapsed(0);
  }, [open]);

  // Session clock
  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [open]);

  // Rest countdown
  useEffect(() => {
    if (!restRunning) return undefined;
    const id = setInterval(() => {
      setRestLeft((left) => {
        if (left <= 1) {
          setRestRunning(false);
          toast("Rest over. Next set!", { icon: "⏱️", id: "rest-over" });
          navigator.vibrate?.(200);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning]);

  const startRest = useCallback(
    (seconds = preset) => {
      setRestLeft(seconds);
      setRestRunning(true);
    },
    [preset]
  );

  const lastFor = useMemo(() => {
    const map = new Map();
    // history is newest first: the first set seen per exercise belongs to the latest session
    const latestDate = new Map();
    for (const s of history) {
      if (!latestDate.has(s.exercise)) latestDate.set(s.exercise, s.date);
      if (latestDate.get(s.exercise) !== s.date) continue;
      const cur = map.get(s.exercise);
      if (!cur || Number(s.weight_kg) >= Number(cur.weight_kg)) map.set(s.exercise, s);
    }
    return map;
  }, [history]);

  const updateExercise = (id, patch) => setExercises((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updateSet = (exId, setId, patch) =>
    setExercises((list) =>
      list.map((e) => (e.id === exId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e))
    );
  const addSet = (exId) =>
    setExercises((list) => list.map((e) => (e.id === exId ? { ...e, sets: [...e.sets, blankSet(e.sets[e.sets.length - 1])] } : e)));
  const removeSet = (exId, setId) =>
    setExercises((list) => list.map((e) => (e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)));
  const removeExercise = (id) => setExercises((list) => (list.length > 1 ? list.filter((e) => e.id !== id) : list));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleaned = exercises
      .map((ex) => ({ ...ex, name: ex.name.trim(), sets: ex.sets.filter((s) => Number(s.reps) > 0) }))
      .filter((ex) => ex.sets.length > 0);
    if (!cleaned.length) return setError("Add at least one set with reps.");
    if (cleaned.some((ex) => !ex.name)) return setError("Choose an exercise for every set you logged.");
    if (cleaned.some((ex) => ex.sets.some((s) => s.weight_kg !== "" && Number(s.weight_kg) < 0))) return setError("Weights can't be negative.");

    const minutes = durationTouched ? Number(duration) : Math.max(1, Math.round(elapsed / 60));
    setSaving(true);
    try {
      const { records } = await saveWorkout({
        name: name.trim() || "Workout",
        date,
        durationMin: minutes,
        notes,
        exercises: cleaned,
        bodyWeightKg,
      });
      onOpenChange(false);
      toast.success("Workout saved");
      records.forEach((r, i) =>
        setTimeout(() => toast(`New personal record: ${r.exercise} ${formatKg(r.weight)} × ${r.reps}`, { icon: "🏆", duration: 6000 }), 400 + i * 600)
      );
    } catch (err) {
      setError(err.message === "setup" ? "Workout tracking isn't set up on this project's database yet (see the notice on the Workouts page)." : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="workout-builder-desc" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" aria-hidden="true" /> Log workout
          </DialogTitle>
          <DialogDescription id="workout-builder-desc">
            Session time {mmss(elapsed)}. Add exercises and sets as you go, or fill it in afterwards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="w-name">Name</Label>
              <Input id="w-name" className="mt-1.5" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Workout (e.g. Push day)" />
            </div>
            <div>
              <Label htmlFor="w-date">Date</Label>
              <Input id="w-date" type="date" className="mt-1.5" value={date} max={localDate()} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <RestTimer
            preset={preset}
            onPreset={(s) => {
              setPreset(s);
              if (!restRunning) setRestLeft(0);
            }}
            running={restRunning}
            left={restLeft}
            onToggle={() => (restRunning ? setRestRunning(false) : startRest(restLeft > 0 ? restLeft : preset))}
            onStop={() => {
              setRestRunning(false);
              setRestLeft(0);
            }}
          />

          <div className="grid gap-4">
            {exercises.map((ex, exIndex) => {
              const last = lastFor.get(ex.name);
              return (
                <section key={ex.id} className="rounded-2xl border border-border bg-background/50 p-3 sm:p-4" aria-label={`Exercise ${exIndex + 1}`}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {ex.custom ? (
                        <Input
                          aria-label="Exercise name"
                          value={ex.name}
                          maxLength={80}
                          autoFocus
                          placeholder="Exercise name"
                          onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                        />
                      ) : (
                        <Select
                          value={ex.name || undefined}
                          onValueChange={(v) => (v === CUSTOM ? updateExercise(ex.id, { custom: true, name: "" }) : updateExercise(ex.id, { name: v }))}
                        >
                          <SelectTrigger aria-label="Exercise">
                            <SelectValue placeholder="Choose exercise" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXERCISE_LIBRARY.map((g) => (
                              <SelectGroup key={g.group}>
                                <SelectLabel>{g.group}</SelectLabel>
                                {g.items.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                            <SelectItem value={CUSTOM}>Custom exercise…</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {last && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Last time: {formatKg(Number(last.weight_kg))} × {last.reps}
                        </p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => removeExercise(ex.id)} disabled={exercises.length === 1} aria-label={`Remove exercise ${exIndex + 1}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_auto_auto] items-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
                    <span className="text-center">Set</span>
                    <span>kg</span>
                    <span>Reps</span>
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    {ex.sets.map((s, i) => (
                      <React.Fragment key={s.id}>
                        <span className="stat-number text-center text-sm text-foreground">{i + 1}</span>
                        <Input
                          aria-label={`Set ${i + 1} weight in kilograms`}
                          inputMode="decimal"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          className="h-11 text-center"
                          value={s.weight_kg}
                          onChange={(e) => updateSet(ex.id, s.id, { weight_kg: e.target.value })}
                        />
                        <Input
                          aria-label={`Set ${i + 1} reps`}
                          inputMode="numeric"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          className="h-11 text-center"
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, s.id, { reps: e.target.value })}
                        />
                        <button
                          type="button"
                          aria-pressed={s.done}
                          aria-label={`Mark set ${i + 1} done and start rest`}
                          onClick={() => {
                            updateSet(ex.id, s.id, { done: !s.done });
                            if (!s.done) startRest();
                          }}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
                            s.done ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSet(ex.id, s.id)}
                          disabled={ex.sets.length === 1}
                          aria-label={`Remove set ${i + 1}`}
                          className="flex h-11 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-30"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => addSet(ex.id)}>
                    <Copy aria-hidden="true" /> Add set
                  </Button>
                </section>
              );
            })}
            <Button type="button" variant="outline" onClick={() => setExercises((l) => [...l, blankExercise()])}>
              <Plus aria-hidden="true" /> Add exercise
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <Label htmlFor="w-duration">Duration (min)</Label>
              <Input
                id="w-duration"
                type="number"
                inputMode="numeric"
                min="1"
                max="1440"
                className="mt-1.5"
                value={durationTouched ? duration : Math.max(1, Math.round(elapsed / 60))}
                onChange={(e) => {
                  setDurationTouched(true);
                  setDuration(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="w-notes">Notes (optional)</Label>
              <Textarea id="w-notes" className="mt-1.5 min-h-[44px]" rows={1} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" />
            </div>
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
              {saving ? "Saving…" : "Save workout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutBuilder;

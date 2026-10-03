// frontend/src/pages/Challenges.jsx
import React, { useEffect, useState } from "react";
import { Trophy, Award, Star, Sparkles, Check, CalendarDays } from "lucide-react";
import toast from "@/lib/toast";
import { useChallengeStore } from "../store/challengeStore";
import { useAuthStore } from "../store/authStore";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";
import { SkeletonCard } from "../components/UI/Skeleton";
import { formatDate } from "../utils/date";
import { onEngagementUpdate } from "../lib/engagement";

const RANK_STYLES = [
  "bg-yellow-400 text-yellow-900",
  "bg-gray-300 text-gray-800",
  "bg-amber-600 text-amber-50",
];

const TYPE_LABELS = { steps: "Steps", workout: "Workout", water: "Water", sleep: "Sleep", custom: "Custom" };

const Challenges = () => {
  const { user } = useAuthStore();
  const {
    availableChallenges,
    myChallenges,
    leaderboard,
    loading,
    error,
    fetchChallengeData,
    joinChallenge,
    generateAIChallenge,
  } = useChallengeStore();
  const [generating, setGenerating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    fetchChallengeData();
    // Refresh when a background progress check completes a challenge
    return onEngagementUpdate((result) => {
      if (result.completedChallenges?.length) fetchChallengeData();
    });
  }, [fetchChallengeData]);

  const joinedIds = new Set(myChallenges.map((uc) => uc.challenge_id));

  const handleJoin = async (challenge) => {
    setJoiningId(challenge.id);
    try {
      await joinChallenge(challenge.id);
      toast.success(`Joined "${challenge.name}"`);
    } catch {
      toast.error("Failed to join challenge");
    } finally {
      setJoiningId(null);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const challenge = await generateAIChallenge();
      toast.success(`New challenge: "${challenge.name}"`);
    } catch (err) {
      toast.error(err.message || "Could not generate a challenge right now.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Page
      title="Challenges"
      icon={Trophy}
      subtitle="Compete, earn points and climb the leaderboard"
      actions={
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          <Sparkles className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`} aria-hidden="true" />
          {generating ? "Creating your challenge…" : "Generate with AI"}
        </button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={4} />
          </div>
          <SkeletonCard lines={5} />
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={Trophy}
            title={error}
            action={
              <button onClick={fetchChallengeData} className="btn-primary">
                Try again
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Joined challenges */}
            <section className="card">
              <h2 className="card-title flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                My active challenges
              </h2>
              {myChallenges.length > 0 ? (
                <ul className="space-y-3">
                  {myChallenges.map((uc) => (
                    <li key={uc.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{uc.challenge.name}</h3>
                          <p className="text-sm text-muted mt-0.5">{uc.challenge.description}</p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                            uc.completed
                              ? "text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/40"
                              : "text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/40"
                          }`}
                        >
                          {uc.completed ? `+${uc.challenge.points} pts earned` : `${uc.challenge.points} pts`}
                        </span>
                      </div>
                      {uc.tracked ? (
                        <>
                          <div className="flex justify-between text-xs mt-3 mb-1">
                            <span className="text-muted">
                              {Number(uc.progress).toLocaleString(undefined, { maximumFractionDigits: 1 })} /{" "}
                              {Number(uc.target).toLocaleString()} {uc.unit}
                            </span>
                            <span className="font-semibold text-foreground">{uc.percent}%</span>
                          </div>
                          <div
                            className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-600"
                            role="progressbar"
                            aria-valuenow={uc.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${uc.challenge.name} progress`}
                          >
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${uc.completed ? "bg-green-500" : "bg-primary-600"}`}
                              style={{ width: `${uc.percent}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="mt-3 text-xs text-muted">Custom challenge: progress isn't tracked automatically.</p>
                      )}
                      <p className="mt-2 text-xs text-muted flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        {uc.completed
                          ? `Completed ${formatDate(uc.completed_at?.slice(0, 10), { month: "short", day: "numeric" })}`
                          : `Ends ${formatDate(uc.challenge.end_date, { month: "short", day: "numeric" })} · progress updates as you log`}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={Trophy} title="No active challenges" description="Join one below, or let the AI create one for you." />
              )}
            </section>

            {/* Available challenges */}
            <section>
              <h2 className="card-title flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary-500" aria-hidden="true" />
                Join a challenge
              </h2>
              {availableChallenges.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableChallenges.map((challenge) => {
                    const joined = joinedIds.has(challenge.id);
                    const mine = challenge.created_by === user?.id && !challenge.is_public;
                    return (
                      <li key={challenge.id} className="card !p-4 flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                            {TYPE_LABELS[challenge.type] || challenge.type}
                          </span>
                          {mine && (
                            <span className="text-xs font-medium text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" aria-hidden="true" /> Made for you
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">{challenge.name}</h3>
                        <p className="text-sm text-muted mt-1 flex-1">{challenge.description}</p>
                        <div className="flex justify-between items-center mt-3 text-xs">
                          <span className="font-bold text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/40 px-2.5 py-1 rounded-full">
                            {challenge.points} pts
                          </span>
                          <span className="text-muted">
                            Ends {formatDate(challenge.end_date, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {joined ? (
                          <p className="btn mt-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 cursor-default">
                            <Check className="w-4 h-4" aria-hidden="true" /> Joined
                          </p>
                        ) : (
                          <button
                            onClick={() => handleJoin(challenge)}
                            disabled={joiningId === challenge.id}
                            className="btn-primary mt-4"
                            aria-label={`Join ${challenge.name}`}
                          >
                            {joiningId === challenge.id ? "Joining…" : "Join challenge"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="card">
                  <EmptyState
                    compact
                    icon={Sparkles}
                    title="No open challenges right now"
                    description="Generate a personalised one with AI, based on your recent activity."
                  />
                </div>
              )}
            </section>
          </div>

          {/* Leaderboard */}
          <section className="card self-start">
            <h2 className="card-title flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-500" aria-hidden="true" />
              Leaderboard
            </h2>
            {leaderboard.top.length > 0 ? (
              <ol className="space-y-2">
                {leaderboard.top.map((entry) => (
                  <li
                    key={entry.rank}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.isMe
                        ? "bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-200 dark:ring-primary-800"
                        : "bg-gray-50 dark:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                          RANK_STYLES[entry.rank - 1] || "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                        }`}
                        aria-label={`Rank ${entry.rank}`}
                      >
                        {entry.rank}
                      </span>
                      <span className="font-medium text-foreground truncate">
                        {entry.name}
                        {entry.isMe && <span className="text-muted font-normal"> (you)</span>}
                      </span>
                    </div>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{entry.points.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No points earned yet. Be the first!</p>
            )}
            {leaderboard.me && !leaderboard.top.some((e) => e.isMe) && (
              <p className="mt-3 flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-sm">
                <span className="font-medium text-foreground">
                  You're #{leaderboard.me.rank}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {leaderboard.me.points.toLocaleString()} pts
                </span>
              </p>
            )}
            <p className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm text-primary-800 dark:text-primary-200">
              💡 Earn points by completing challenges, unlocking achievements and finishing AR workouts.
            </p>
          </section>
        </div>
      )}
    </Page>
  );
};

export default Challenges;

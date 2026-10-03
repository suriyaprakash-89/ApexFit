// frontend/src/components/Profile/AchievementsCard.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Medal, Lock } from "lucide-react";
import { apiJson, withClientDate } from "../../lib/api";
import { onEngagementUpdate } from "../../lib/engagement";
import { Skeleton } from "../UI/Skeleton";

const AchievementsCard = ({ points }) => {
  const [achievements, setAchievements] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setAchievements(await apiJson(`/api/achievements?${withClientDate()}`));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    return onEngagementUpdate((result) => {
      if (result.unlockedAchievements?.length) load();
    });
  }, [load]);

  const earned = achievements?.filter((a) => a.earned).length || 0;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="card-title flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-500" aria-hidden="true" />
          Achievements
        </h2>
        <p className="text-sm text-muted">
          {achievements ? `${earned} of ${achievements.length} unlocked` : ""}
          {points != null && <span className="ml-2 font-semibold text-purple-600 dark:text-purple-400">{points.toLocaleString()} pts</span>}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-muted">
          Couldn't load achievements.{" "}
          <button onClick={load} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : !achievements ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((a) => (
            <li
              key={a.id}
              className={`relative p-3 rounded-xl border text-center ${
                a.earned
                  ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                  : "border-border"
              }`}
              title={a.description}
            >
              {!a.earned && <Lock className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-400" aria-hidden="true" />}
              <span className={`text-3xl ${a.earned ? "" : "grayscale opacity-50"}`} aria-hidden="true">
                {a.icon || "🏅"}
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground leading-tight">{a.name}</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">{a.description}</p>
              {a.earned ? (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">+{a.points} pts</p>
              ) : (
                <div className="mt-2" aria-label={`${a.progress} of ${a.target}`}>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${a.percent}%` }} />
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    {a.progress}/{a.target}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AchievementsCard;

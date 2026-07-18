import React, { useEffect } from "react";
import { useChallengeStore } from "../store/challengeStore";
import { useAuthStore } from "../store/authStore";
import { Trophy, Award, Star, Loader, Sparkles } from "lucide-react"; // 1. Import Sparkles
import toast from "react-hot-toast";

const Challenges = () => {
  const { user } = useAuthStore();
  const {
    publicChallenges,
    userChallenges,
    leaderboard,
    loading,
    fetchChallengeData,
    joinChallenge,
    generateAIChallenge, // 2. Import the new function from the store
  } = useChallengeStore();

  useEffect(() => {
    fetchChallengeData();
  }, []);

  const handleJoinChallenge = async (challenge) => {
    const promise = joinChallenge(challenge.id);
    toast.promise(promise, {
      loading: `Joining '${challenge.name}'...`,
      success: `Successfully joined '${challenge.name}'!`,
      error: "Failed to join challenge.",
    });
  };

  // The handler you already wrote
  const handleGenerateChallenge = () => {
    const promise = generateAIChallenge();
    toast.promise(promise, {
      loading: "🤖 Our AI is crafting a new challenge for you...",
      success: "New challenge generated! Ready to join?",
      error: "Could not generate a challenge right now.",
    });
  };

  const isJoined = (challengeId) => {
    return userChallenges.some((uc) => uc.challenge_id === challengeId);
  };

  const getRankColor = (index) => {
    if (index === 0) return "bg-yellow-400 text-yellow-900"; // Gold
    if (index === 1) return "bg-gray-300 text-gray-800"; // Silver
    if (index === 2) return "bg-yellow-600 text-yellow-100"; // Bronze
    return "bg-gray-700 text-gray-200";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin " />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Active & Public Challenges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Challenges (Joined by User) */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center mb-4">
              <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
              My Active Challenges
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {userChallenges.length > 0 ? (
                <div className="space-y-4">
                  {userChallenges.map((uc) => (
                    <div
                      key={uc.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <h3 className="font-semibold">{uc.challenges.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {uc.challenges.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No active challenges at the moment. Join one below!
                </p>
              )}
            </div>
          </div>

          {/* Public Challenges (Available to Join) */}
          <div>
            {/* 3. Add the "Generate with AI" button to the header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <Star className="w-6 h-6 mr-2 text-blue-500" />
                Join a Challenge
              </h2>
              <button
                onClick={handleGenerateChallenge}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicChallenges.length > 0 ? (
                publicChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="group relative bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-transparent hover:border-blue-500 transition-all"
                  >
                    <h3 className="font-semibold">{challenge.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {challenge.description}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-bold text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full">
                        {challenge.points} pts
                      </span>
                      <span className="text-xs text-gray-400">
                        Ends:{" "}
                        {new Date(challenge.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      {isJoined(challenge.id) ? (
                        <span className="text-white font-bold py-2 px-4 rounded-lg bg-green-600">
                          Already Joined
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinChallenge(challenge)}
                          className="text-white font-bold py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 md:col-span-2">
                  No new public challenges available right now. Check back
                  later!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Global Leaderboard */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center mb-4">
            <Award className="w-6 h-6 mr-2 text-purple-500" />
            Global Leaderboard
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <ul className="space-y-3">
              {leaderboard.map((profile, index) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${getRankColor(
                        index
                      )}`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {profile.name || `User #${profile.id.substring(0, 4)}`}
                    </span>
                  </div>
                  <span className="font-bold text-purple-500">
                    {profile.points.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center text-sm text-blue-700 dark:text-blue-300">
              💡 Earn points by completing activities, achieving goals, and
              winning challenges!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;

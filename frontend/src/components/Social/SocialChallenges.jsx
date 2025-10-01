// frontend/src/components/SocialChallenges.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { Trophy, Users, Calendar, Award } from "lucide-react";

const SocialChallenges = () => {
  const { user } = useAuthStore();
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
  }, [user]);

  const fetchChallenges = async () => {
    // Fetch active challenges from database
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false });

    setChallenges(data || []);
  };

  const fetchLeaderboard = async () => {
    // Fetch leaderboard data
    const { data } = await supabase
      .from("profiles")
      .select("id, name, points")
      .order("points", { ascending: false })
      .limit(10);

    setLeaderboard(data || []);
  };

  const joinChallenge = async (challengeId) => {
    await supabase
      .from("user_challenges")
      .insert([{ user_id: user.id, challenge_id: challengeId }]);

    toast.success("Challenge joined!");
    fetchChallenges();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Challenges Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Active Challenges
          </h3>
        </div>

        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  {challenge.name}
                </h4>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded">
                  {challenge.points} pts
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {challenge.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{challenge.participants_count} participants</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Ends: {new Date(challenge.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => joinChallenge(challenge.id)}
                className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Join Challenge
              </button>
            </div>
          ))}

          {challenges.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No active challenges at the moment. Check back later!
            </p>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Award className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Global Leaderboard
          </h3>
        </div>

        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index < 3
                  ? "bg-yellow-50 dark:bg-yellow-900/20"
                  : "bg-gray-50 dark:bg-gray-700"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    index === 0
                      ? "bg-yellow-200 text-yellow-800"
                      : index === 1
                      ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      : index === 2
                      ? "bg-orange-200 text-orange-800"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`font-medium ${
                    index < 3
                      ? "text-gray-800 dark:text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {user.name}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">
                {user.points || 0}
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No leaderboard data yet. Be the first to earn points!
            </p>
          )}
        </div>

        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Earn points by completing activities, achieving goals, and
            winning challenges!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialChallenges;

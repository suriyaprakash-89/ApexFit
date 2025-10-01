// frontend/src/components/ARFitnessChallenge.jsx
import React, { useState, useRef } from "react";
import { Camera, Target, Trophy, Video } from "lucide-react";

const ARFitnessChallenge = () => {
  const [activeChallenge, setActiveChallenge] = useState(null);
  const videoRef = useRef(null);

  const challenges = [
    {
      id: 1,
      name: "Wall Sit Challenge",
      description: "Find a wall and maintain a sitting position",
      duration: 60,
      points: 100,
    },
    {
      id: 2,
      name: "Plank Challenge",
      description: "Hold a plank position as long as you can",
      duration: 120,
      points: 150,
    },
    {
      id: 3,
      name: "Jumping Jacks",
      description: "Perform jumping jacks with proper form",
      duration: 90,
      points: 120,
    },
  ];

  const startChallenge = async (challenge) => {
    setActiveChallenge(challenge);

    try {
      // Access device camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start pose detection and timer
      startPoseDetection(challenge);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const startPoseDetection = (challenge) => {
    // This would integrate with a pose detection library like TensorFlow.js
    console.log("Starting pose detection for:", challenge.name);

    // Simulate completion for demo
    setTimeout(() => {
      completeChallenge(challenge);
    }, 5000);
  };

  const completeChallenge = (challenge) => {
    // Award points and show results
    alert(`Challenge completed! You earned ${challenge.points} points!`);
    setActiveChallenge(null);

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Video className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          AR Fitness Challenges
        </h3>
      </div>

      {activeChallenge ? (
        <div className="text-center">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"
            />
            <div className="absolute bottom-4 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <p className="font-semibold">{activeChallenge.name}</p>
              <p>Hold the position for {activeChallenge.duration} seconds</p>
            </div>
          </div>
          <button
            onClick={() => setActiveChallenge(null)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Cancel Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Use your camera to complete fitness challenges with AR guidance and
            form correction.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => startChallenge(challenge)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {challenge.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {challenge.duration}s
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      {challenge.points} pts
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Camera className="w-4 h-4 mr-1" />
            <span>Camera access required for AR experience</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARFitnessChallenge;

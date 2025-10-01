// frontend/src/components/ARFitnessChallenge.jsx
import React, { useState, useRef, useEffect } from "react";
import { Camera, Video, Loader, X } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { checkWallSit, checkPlank, drawSkeleton } from "../../utils/poseUtils";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const RotateDevicePrompt = () => (
  <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[100] p-4 text-white text-center landscape:hidden">
    <svg className="w-24 h-24 mb-4 transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zM5 11h14" />
    </svg>
    <h2 className="text-2xl font-bold">Please Rotate Your Device</h2>
    <p className="mt-2 text-gray-300">For the best experience, please use landscape mode.</p>
  </div>
);

const ARFitnessChallenge = () => {
  const { user } = useAuthStore();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);

  const [feedback, setFeedback] = useState("Get into position...");
  const [timer, setTimer] = useState(0);
  const [isPoseCorrect, setIsPoseCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [lastSpokenFeedback, setLastSpokenFeedback] = useState("");

  const challenges = [
    {
      id: 1,
      name: "Wall Sit Challenge",
      description: "Maintain a sitting position against a wall",
      duration: 30,
      points: 100,
    },
    {
      id: 2,
      name: "Plank Challenge",
      description: "Hold a straight plank position",
      duration: 45,
      points: 150,
    },
  ];

  const speak = (text) => {
    if (text && text !== lastSpokenFeedback) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
      setLastSpokenFeedback(text);
    }
  };

  useEffect(() => {
    if (activeChallenge && !showSetup && isVideoReady) {
      speak(feedback);
    }
  }, [feedback]);

  const loadPoseDetector = async () => {
    setIsLoading(true);
    setFeedback("Initializing AI Model...");
    await tf.ready();
    await tf.setBackend("webgl");
    if (!detectorRef.current) {
      setFeedback("Downloading AI Model (first time only)...");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      detectorRef.current = detector;
    }
    setIsLoading(false);
  };

  const startChallengeSetup = (challenge) => {
    setActiveChallenge(challenge);
    setShowSetup(true);
  };

  const beginChallenge = async () => {
    setShowSetup(false);
    setTimer(0);
    setFeedback("Starting camera...");
    try {
      await loadPoseDetector();
      // --- FIX: Request a 16:9 widescreen video resolution ---
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoReady(true);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setFeedback("Camera access denied. Please enable camera permissions.");
      setActiveChallenge(null);
    }
  };

  useEffect(() => {
    let detectionInterval;
    if (isVideoReady) {
      const initialFeedback = "Get into position...";
      setFeedback(initialFeedback);
      speak(initialFeedback);
      detectionInterval = setInterval(() => {
        detectPose();
      }, 100);
    }
    return () => clearInterval(detectionInterval);
  }, [isVideoReady]);

  const detectPose = async () => {
    if (
      !detectorRef.current ||
      !videoRef.current ||
      videoRef.current.readyState !== 4 ||
      !activeChallenge
    )
      return;
    const video = videoRef.current;
    const poses = await detectorRef.current.estimatePoses(video);
    const ctx = canvasRef.current.getContext("2d");
    if (poses && poses.length > 0) {
      drawSkeleton(poses[0].keypoints, ctx);
      let correct = false;
      if (activeChallenge.name === "Wall Sit Challenge") {
        correct = checkWallSit(poses[0].keypoints, setFeedback);
      } else if (activeChallenge.name === "Plank Challenge") {
        correct = checkPlank(poses[0].keypoints, setFeedback);
      }
      setIsPoseCorrect(correct);
    } else {
      setIsPoseCorrect(false);
      if (
        feedback !== "Great form! Hold the pose." &&
        feedback !== "Perfect plank! Keep your body straight."
      ) {
        setFeedback("No person detected. Make sure you are in frame.");
      }
    }
  };

  useEffect(() => {
    let timerInterval = null;
    if (activeChallenge && isPoseCorrect) {
      timerInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev + 1 >= activeChallenge.duration) {
            completeChallenge(activeChallenge);
            return activeChallenge.duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [activeChallenge, isPoseCorrect]);

  const stopChallenge = () => {
    window.speechSynthesis.cancel();
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setActiveChallenge(null);
    setIsPoseCorrect(false);
    setShowSetup(false);
    setIsVideoReady(false);
    setLastSpokenFeedback("");
  };

  const saveChallengeResults = async (challenge) => {
    if (!user) {
      console.error("User not found, cannot save points.");
      setFeedback("Could not save points. Please log in again.");
      return;
    }
    setFeedback("Saving your points...");
    speak("Saving your points.");
    const { error: rpcError } = await supabase.rpc(
      "award_ar_challenge_points",
      {
        user_id_input: user.id,
        points_to_add: challenge.points,
        challenge_name: challenge.name,
      }
    );
    if (rpcError) {
      console.error("Error updating user points:", rpcError);
      speak("There was an error saving your points.");
    } else {
      console.log("Successfully saved points and logged challenge.");
    }
  };

  const completeChallenge = async (challenge) => {
    const completionMessage = `Challenge Complete! You earned ${challenge.points} points!`;
    setFeedback(completionMessage);
    speak(completionMessage);
    await saveChallengeResults(challenge);
    setTimeout(stopChallenge, 4000);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Video className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            AR Fitness Challenges
          </h3>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Use your camera to complete fitness challenges with AR guidance.
          </p>
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => startChallengeSetup(challenge)}
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
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Camera className="w-4 h-4 mr-1" />
            <span>Camera access required</span>
          </div>
        </div>
      </div>

      {activeChallenge && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 animate-fade-in">
          
          <RotateDevicePrompt />

          <button
            onClick={stopChallenge}
            className="absolute top-4 right-4 text-white bg-red-600 rounded-full p-2 hover:bg-red-700 z-20"
          >
            <X size={24} />
          </button>

          {isLoading ? (
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-white">{feedback}</p>
            </div>
          ) : showSetup ? (
            <div className="text-center p-4">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Camera Setup
              </h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Place your device on a stable surface about 6-8 feet away. Make
                sure your{" "}
                <strong className="text-blue-400">
                  entire body is visible
                </strong>
                .
              </p>
              <div className="space-x-4">
                <button
                  onClick={stopChallenge}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={beginChallenge}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  I'm Ready!
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 w-screen h-screen">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* --- FIX: Update canvas dimensions to match video --- */}
                <canvas
                  ref={canvasRef}
                  width="1280"
                  height="720"
                  className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
                />
              </div>
              <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-6 text-shadow-lg">
                <h2 className="text-4xl font-bold text-white">
                  {activeChallenge.name}
                </h2>
                <div
                  className={`text-3xl font-semibold p-3 rounded-lg bg-black bg-opacity-50 ${
                    isPoseCorrect ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {feedback}
                </div>
                <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg">
                  <p className="font-semibold text-5xl font-mono">
                    {timer}s / {activeChallenge.duration}s
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ARFitnessChallenge;

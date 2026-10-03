// frontend/src/components/AR/ARFitnessChallenge.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Loader, X, Volume2, VolumeX, Timer, Trophy, Smartphone, CameraOff } from "lucide-react";
import { checkWallSit, checkPlank, drawSkeleton } from "../../utils/poseUtils";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const CHALLENGES = [
  {
    id: "wall-sit",
    name: "Wall Sit Challenge",
    description: "Hold a seated position against a wall with knees at 90°.",
    duration: 30,
    points: 100,
    check: checkWallSit,
    requiresLandscape: false,
    setupTip: "Stand side-on to the camera so your hips, knees and ankles are visible.",
  },
  {
    id: "plank",
    name: "Plank Challenge",
    description: "Hold a straight plank from shoulders to ankles.",
    duration: 45,
    points: 150,
    check: checkPlank,
    requiresLandscape: true,
    setupTip: "Place the phone on the floor in landscape, side-on to your body.",
  },
];

const DETECT_INTERVAL_MS = 100;

const ARFitnessChallenge = () => {
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState(null);
  // phase: setup -> loading -> active -> complete | error
  const [phase, setPhase] = useState(null);
  const [feedback, setFeedback] = useState("Get into position…");
  const [timer, setTimer] = useState(0);
  const [isPoseCorrect, setIsPoseCorrect] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [ignoreRotate, setIgnoreRotate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const feedbackRef = useRef("");
  const lastSpokenRef = useRef("");
  const completedRef = useRef(false);
  const voiceRef = useRef(voiceOn);
  voiceRef.current = voiceOn;

  const speak = useCallback((text) => {
    if (!voiceRef.current || !("speechSynthesis" in window) || !text || text === lastSpokenRef.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  }, []);

  const updateFeedback = useCallback(
    (text) => {
      if (text === feedbackRef.current) return;
      feedbackRef.current = text;
      setFeedback(text);
      speak(text);
    },
    [speak]
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const closeChallenge = useCallback(() => {
    stopCamera();
    setChallenge(null);
    setPhase(null);
    setIsPoseCorrect(false);
    setTimer(0);
    setIgnoreRotate(false);
    lastSpokenRef.current = "";
    feedbackRef.current = "";
  }, [stopCamera]);

  // Release the camera and model if the user navigates away mid-challenge
  useEffect(
    () => () => {
      stopCamera();
      detectorRef.current?.dispose?.();
      detectorRef.current = null;
    },
    [stopCamera]
  );

  const loadDetector = async () => {
    if (detectorRef.current) return detectorRef.current;
    // Loaded on demand so TensorFlow (~MBs) is never part of the normal app bundle
    const [tf, poseDetection] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("@tensorflow-models/pose-detection"),
    ]);
    await tf.ready();
    await tf.setBackend("webgl");
    detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    });
    return detectorRef.current;
  };

  const beginChallenge = async () => {
    setPhase("loading");
    setTimer(0);
    completedRef.current = false;
    setFeedback("Loading the pose model…");
    try {
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }),
        loadDetector(),
      ]);
      streamRef.current = stream;
      setPhase("active");
    } catch (error) {
      console.error("AR start failed:", error);
      stopCamera();
      setErrorMessage(
        error?.name === "NotAllowedError"
          ? "Camera access was blocked. Allow camera permission in your browser settings and try again."
          : error?.name === "NotFoundError"
          ? "No camera was found on this device."
          : "Couldn't start the AR challenge on this device."
      );
      setPhase("error");
    }
  };

  // Attach the stream once the <video> element is rendered, then start detecting
  useEffect(() => {
    if (phase !== "active" || !challenge) return;
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;

    let lastRun = 0;
    let busy = false;

    const loop = async (now) => {
      rafRef.current = requestAnimationFrame(loop);
      if (busy || now - lastRun < DETECT_INTERVAL_MS || video.readyState < 2) return;
      busy = true;
      lastRun = now;
      try {
        const canvas = canvasRef.current;
        // Match the canvas to the real video resolution so the skeleton lines up
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const poses = await detectorRef.current.estimatePoses(video);
        const ctx = canvas?.getContext("2d");
        if (poses?.length) {
          if (ctx) drawSkeleton(poses[0].keypoints, ctx);
          setIsPoseCorrect(challenge.check(poses[0].keypoints, updateFeedback));
        } else {
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          setIsPoseCorrect(false);
          updateFeedback("Step into the frame so your full body is visible.");
        }
      } catch (err) {
        console.error("Pose detection error:", err);
      } finally {
        busy = false;
      }
    };

    const start = () => {
      updateFeedback("Get into position…");
      rafRef.current = requestAnimationFrame(loop);
    };
    video.onloadeddata = start;
    if (video.readyState >= 2) start();

    return () => {
      video.onloadeddata = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase, challenge, updateFeedback]);

  // Count up only while the pose is held correctly
  useEffect(() => {
    if (phase !== "active" || !isPoseCorrect) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPoseCorrect]);

  const saveResults = useCallback(
    async (done) => {
      if (!user) return { ok: false };
      // Returns the points awarded: 0 means this challenge was already rewarded today
      const { data, error } = await supabase.rpc("award_ar_challenge_points", {
        user_id_input: user.id,
        points_to_add: done.points,
        challenge_name: done.name,
      });
      if (error) console.error("Error saving AR points:", error);
      return { ok: !error, awarded: data };
    },
    [user]
  );

  // Completion runs exactly once (no side effects inside state updaters)
  useEffect(() => {
    if (phase !== "active" || !challenge || timer < challenge.duration || completedRef.current) return;
    completedRef.current = true;
    stopCamera();
    setIsPoseCorrect(false);
    setPhase("complete");
    const message = `Challenge complete! You earned ${challenge.points} points!`;
    setFeedback(message);
    speak(message);
    saveResults(challenge).then(({ ok, awarded }) => {
      if (!ok) setFeedback("Challenge complete! We couldn't save your points. Please check your connection.");
      else if (awarded === 0) setFeedback("Challenge complete! You've already earned today's points for this one. Come back tomorrow!");
    });
  }, [timer, phase, challenge, stopCamera, speak, saveResults]);

  const showRotatePrompt = challenge?.requiresLandscape && phase === "active" && !ignoreRotate;
  const progress = challenge ? Math.min((timer / challenge.duration) * 100, 100) : 0;

  return (
    <>
      <div className="card">
        <p className="text-muted mb-5">
          Use your camera and on-device AI to check your form in real time. Video never leaves your device.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHALLENGES.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setChallenge(c);
                  setPhase("setup");
                }}
                className="w-full text-left p-4 rounded-xl border border-border hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted mt-1">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted flex items-center gap-1 justify-end">
                      <Timer className="w-4 h-4" aria-hidden="true" />
                      {c.duration}s
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 font-semibold">{c.points} pts</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <p className="flex items-center text-sm text-muted mt-4">
          <Camera className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Camera access required
        </p>
      </div>

      {challenge && (
        <div
          className="fixed inset-0 z-[70] bg-gray-950 text-white flex flex-col animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={challenge.name}
        >
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between gap-2 p-3 safe-top">
            <button
              onClick={() => setVoiceOn((v) => !v)}
              className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center"
              aria-label={voiceOn ? "Mute voice coaching" : "Unmute voice coaching"}
              aria-pressed={!voiceOn}
            >
              {voiceOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={closeChallenge}
              className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
              aria-label="Exit challenge"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {phase === "setup" && (
            <div className="m-auto text-center p-6 max-w-md">
              <h2 className="text-2xl sm:text-3xl font-bold">{challenge.name}</h2>
              <p className="mt-4 text-gray-300">
                Place your device on a stable surface about 2 metres away and make sure your{" "}
                <strong className="text-primary-300">entire body is visible</strong>.
              </p>
              <p className="mt-2 text-gray-400 text-sm">{challenge.setupTip}</p>
              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 justify-center">
                <button onClick={closeChallenge} className="btn bg-gray-700 hover:bg-gray-600 text-white">
                  Back
                </button>
                <button onClick={beginChallenge} className="btn bg-green-600 hover:bg-green-700 text-white">
                  I'm ready
                </button>
              </div>
            </div>
          )}

          {phase === "loading" && (
            <div className="m-auto text-center p-6" role="status">
              <Loader className="w-12 h-12 text-primary-400 animate-spin mx-auto" aria-hidden="true" />
              <p className="mt-4 text-gray-200">{feedback}</p>
              <p className="mt-1 text-sm text-gray-400">The first time can take a few seconds.</p>
            </div>
          )}

          {phase === "error" && (
            <div className="m-auto text-center p-6 max-w-md" role="alert">
              <CameraOff className="w-12 h-12 mx-auto text-red-400" aria-hidden="true" />
              <p className="mt-4 text-gray-200">{errorMessage}</p>
              <button onClick={closeChallenge} className="btn mt-6 bg-gray-700 hover:bg-gray-600 text-white">
                Back to challenges
              </button>
            </div>
          )}

          {phase === "complete" && (
            <div className="m-auto text-center p-6 max-w-md" role="status">
              <Trophy className="w-16 h-16 mx-auto text-yellow-400" aria-hidden="true" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold">Well done!</h2>
              <p className="mt-2 text-gray-200">{feedback}</p>
              <button onClick={closeChallenge} className="btn mt-6 bg-green-600 hover:bg-green-700 text-white">
                Finish
              </button>
            </div>
          )}

          {phase === "active" && (
            <>
              <div className="absolute inset-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                {/* Same object-fit + intrinsic size as the video, so points line up */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
              </div>

              <div className="relative z-10 flex flex-col items-center justify-between h-full w-full px-4 pt-20 pb-8 safe-bottom">
                <h2 className="text-xl sm:text-3xl font-bold text-center drop-shadow">{challenge.name}</h2>
                <p
                  className={`max-w-xl text-center text-lg sm:text-2xl font-semibold px-4 py-2 rounded-xl bg-black/60 ${
                    isPoseCorrect ? "text-green-400" : "text-yellow-300"
                  }`}
                  aria-live="polite"
                >
                  {feedback}
                </p>
                <div className="w-full max-w-sm bg-black/60 rounded-2xl p-4 text-center">
                  <p className="font-mono font-semibold text-3xl sm:text-5xl">
                    {timer}s <span className="text-gray-400 text-xl sm:text-3xl">/ {challenge.duration}s</span>
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/20" aria-hidden="true">
                    <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              {showRotatePrompt && (
                <div className="absolute inset-0 z-20 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center landscape:hidden">
                  <Smartphone className="w-20 h-20 mb-4 -rotate-90" aria-hidden="true" />
                  <h2 className="text-2xl font-bold">Rotate your device</h2>
                  <p className="mt-2 text-gray-300">Landscape works best for planks.</p>
                  <button onClick={() => setIgnoreRotate(true)} className="btn mt-6 bg-gray-700 hover:bg-gray-600 text-white">
                    Continue in portrait
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ARFitnessChallenge;

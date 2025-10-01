// frontend/src/utils/poseUtils.js

// Function to calculate the angle between three keypoints
function calculateAngle(a, b, c) {
  if (!a || !b || !c) return null;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

// --- Challenge Logic ---

export function checkWallSit(keypoints, feedbackCallback) {
  const confidenceThreshold = 0.4;

  const getKeypoint = (name) =>
    keypoints.find((p) => p.name === name && p.score > confidenceThreshold);

  const leftHip = getKeypoint("left_hip");
  const leftKnee = getKeypoint("left_knee");
  const leftAnkle = getKeypoint("left_ankle");
  const rightHip = getKeypoint("right_hip");
  const rightKnee = getKeypoint("right_knee");
  const rightAnkle = getKeypoint("right_ankle");

  if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle) {
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Check if knees are bent at roughly 90 degrees
    if (
      leftKneeAngle > 80 &&
      leftKneeAngle < 110 &&
      rightKneeAngle > 80 &&
      rightKneeAngle < 110
    ) {
      feedbackCallback("Great form! Hold the pose.");
      return true;
    } else {
      feedbackCallback("Bend your knees to a 90-degree angle.");
      return false;
    }
  }

  feedbackCallback("Make sure your full body is visible.");
  return false;
}

export function checkPlank(keypoints, feedbackCallback) {
  const confidenceThreshold = 0.4;

  const getKeypoint = (name) =>
    keypoints.find((p) => p.name === name && p.score > confidenceThreshold);

  const leftShoulder = getKeypoint("left_shoulder");
  const leftHip = getKeypoint("left_hip");
  const leftAnkle = getKeypoint("left_ankle");
  const rightShoulder = getKeypoint("right_shoulder");
  const rightHip = getKeypoint("right_hip");
  const rightAnkle = getKeypoint("right_ankle");

  // Use the side that is more visible
  const shoulder =
    leftShoulder?.score > rightShoulder?.score ? leftShoulder : rightShoulder;
  const hip = leftHip?.score > rightHip?.score ? leftHip : rightHip;
  const ankle = leftAnkle?.score > rightAnkle?.score ? leftAnkle : rightAnkle;

  if (shoulder && hip && ankle) {
    const bodyAngle = calculateAngle(shoulder, hip, ankle);

    // A straight body will have an angle close to 180 degrees
    if (bodyAngle > 160 && bodyAngle < 190) {
      feedbackCallback("Perfect plank! Keep your body straight.");
      return true;
    } else if (bodyAngle < 160) {
      feedbackCallback("Lift your hips to straighten your back.");
      return false;
    } else {
      feedbackCallback("Lower your hips to form a straight line.");
      return false;
    }
  }

  feedbackCallback("Position yourself sideways to the camera for plank.");
  return false;
}

// --- Drawing Utilities ---
const keypointConnections = [
  // Define connections between keypoints to draw a skeleton
  { start: "left_ear", end: "right_ear" },
  { start: "left_shoulder", end: "right_shoulder" },
  // ... add more connections as needed for a full skeleton
];

// In frontend/src/utils/poseUtils.js

export function drawSkeleton(keypoints, ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const keypointColor = "blue";
  const linkColor = "red"; // FIX #1: Corrected the typo

  // --- START: NEW CODE TO DRAW SKELETON LINES ---
  const keypointConnections = [
    // Torso
    ["left_shoulder", "right_shoulder"],
    ["left_hip", "right_hip"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    // Left Arm
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    // Right Arm
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    // Left Leg
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    // Right Leg
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ];

  const getKeypoint = (name) => keypoints.find((p) => p.name === name);

  // Draw the lines
  for (const [start, end] of keypointConnections) {
    const startPoint = getKeypoint(start);
    const endPoint = getKeypoint(end);

    if (
      startPoint &&
      endPoint &&
      startPoint.score > 0.3 &&
      endPoint.score > 0.3
    ) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // --- END: NEW CODE ---

  // Draw keypoints (dots) on top of the lines
  keypoints.forEach((point) => {
    if (point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = keypointColor;
      ctx.fill();
    }
  });
}

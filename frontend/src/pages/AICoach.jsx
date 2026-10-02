// frontend/src/pages/AICoach.jsx
import React, { useEffect } from "react";
import AIHealthCoach from "../components/AI/AIHealthCoach";

// Full-height chat layout: edge-to-edge on phones, a card on larger screens.
const AICoach = () => {
  useEffect(() => {
    document.title = "AI Coach · ApeXfit";
  }, []);

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 sm:py-6">
      <AIHealthCoach />
    </div>
  );
};

export default AICoach;

// frontend/src/pages/ARFitness.jsx
import React from "react";
import { ScanFace } from "lucide-react";
import Page from "../components/UI/Page";
import ARFitnessChallenge from "../components/AR/ARFitnessChallenge";

const ARFitness = () => (
  <Page title="AR Fitness" icon={ScanFace} subtitle="Hold the pose, the camera checks your form">
    <ARFitnessChallenge />
  </Page>
);

export default ARFitness;

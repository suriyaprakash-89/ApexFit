// frontend/src/pages/Insights.jsx
import React from "react";
import { BarChart3 } from "lucide-react";
import Page from "../components/UI/Page";
import FitnessDNAReport from "../components/AI/FitnessDNAReport";

const Insights = () => (
  <Page title="Insights" icon={BarChart3} subtitle="Your Fitness DNA, built from your real data">
    <FitnessDNAReport />
  </Page>
);

export default Insights;

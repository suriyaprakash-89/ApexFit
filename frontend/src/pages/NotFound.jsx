// frontend/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Page from "../components/UI/Page";
import EmptyState from "../components/UI/EmptyState";

const NotFound = () => (
  <Page title="Page not found">
    <div className="card">
      <EmptyState
        icon={Compass}
        title="We couldn't find that page"
        description="It may have moved. Head back to your dashboard to keep going."
        action={
          <Link to="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
        }
      />
    </div>
  </Page>
);

export default NotFound;

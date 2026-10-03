// frontend/src/components/UI/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Catches render errors and failed lazy-page downloads (e.g. a page opened
 * offline for the first time, or an old chunk after a deploy) instead of
 * showing a blank screen.
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating to another page clears the error
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunkFailed = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(
      this.state.error?.message || ""
    );
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="alert">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          {chunkFailed ? "This page couldn't be loaded" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {chunkFailed && !navigator.onLine
            ? "You're offline and this page hasn't been downloaded yet. Connect and try again."
            : "Please reload the page. If it keeps happening, try again later."}
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-6">
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;

import { Component, type ReactNode } from "react";

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed", inset: 0, background: "white",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 24, textAlign: "center", zIndex: 9999,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ fontFamily: "system-ui", fontWeight: 700, fontSize: 18, color: "#111", margin: "0 0 8px" }}>
            Something went wrong
          </h2>
          <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            Failed to load the map. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#16a34a", color: "white", border: "none",
              borderRadius: 9999, padding: "12px 24px",
              fontFamily: "system-ui", fontSize: 15, fontWeight: 600,
              cursor: "pointer", minHeight: 44,
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

"use client";
import React, { useEffect, useState } from "react";

// Utility to detect iOS
function isIOS() {
  if (typeof window === "undefined") return false;
  return (
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !window.matchMedia("(display-mode: standalone)").matches
  );
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Handle beforeinstallprompt for supported browsers
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Handle iOS custom prompt
    if (isIOS()) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  // Hide prompt if already installed (standalone mode)
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
      setShowIOSPrompt(false);
    }
  }, []);

  if (!showPrompt && !showIOSPrompt) return null;

  return (
    <div style={{ position: "fixed", bottom: 20, left: 0, right: 0, textAlign: "center", zIndex: 1000 }}>
      {showPrompt && (
        <button
          onClick={handleInstallClick}
          style={{
            padding: "1em 2em",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1em",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          Install this app
        </button>
      )}
      {showIOSPrompt && (
        <div
          style={{
            background: "#fffbe6",
            color: "#222",
            border: "1px solid #ffe58f",
            borderRadius: "8px",
            padding: "1em 2em",
            display: "inline-block",
            fontSize: "1.1em",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}
        >
          <span role="img" aria-label="info">📱</span> To install this app, tap <span style={{fontWeight: 'bold'}}>Share</span> <span role="img" aria-label="share">[⬆️]</span> and then <span style={{fontWeight: 'bold'}}>Add to Home Screen</span>.
        </div>
      )}
    </div>
  );
};

export default InstallPrompt; 
"use client";
import React, { useEffect, useState, useRef } from "react";

const CLIENT_ID = "512093380421-7rbbejhoj7gevce2rm2fo29r23l4h8qc.apps.googleusercontent.com";
const API_KEY = "";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const SCOPES = "https://www.googleapis.com/auth/calendar";

function loadGISScript(cb: () => void) {
  if (document.getElementById("google-identity-services")) return cb();
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.id = "google-identity-services";
  script.onload = cb;
  document.body.appendChild(script);
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function GoogleCalendarSync({ onRefresh }: { onRefresh?: () => void }) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; imageUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenClient = useRef<any>(null);
  const accessToken = useRef<string | null>(null);

  // Load gapi client
  useEffect(() => {
    function start() {
      window.gapi.client
        .init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        })
        .then(() => setGapiLoaded(true));
    }
    if (window.gapi) {
      window.gapi.load("client", start);
    } else {
      const interval = setInterval(() => {
        if (window.gapi) {
          window.gapi.load("client", start);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Load GIS script
  useEffect(() => {
    loadGISScript(() => setGisLoaded(true));
  }, []);

  // Initialize GIS token client
  useEffect(() => {
    if (!gisLoaded) return;
    if (!tokenClient.current) {
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            accessToken.current = tokenResponse.access_token;
            setIsSignedIn(true);
            setLoading(false);
            fetchUserInfo();
            if (onRefresh) onRefresh();
          }
        },
      });
    }
    setLoading(false);
  }, [gisLoaded, onRefresh]);

  // Fetch user info using Google People API
  const fetchUserInfo = async () => {
    if (!accessToken.current) return;
    try {
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken.current}` },
        }
      );
      const data = await res.json();
      setUser({
        name: data.name,
        email: data.email,
        imageUrl: data.picture,
      });
    } catch (e) {
      setUser(null);
    }
  };

  // Sign in handler
  const handleSignIn = () => {
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    setIsSignedIn(false);
    setUser(null);
    accessToken.current = null;
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div style={{ textAlign: "center", padding: 12 }}>
      {loading && <div>Loading Google Calendar integration...</div>}
      {!loading && !isSignedIn && (
        <button onClick={handleSignIn} style={{ padding: "0.7em 2em", fontSize: "1.1em", borderRadius: 8, background: "#4285F4", color: "#fff", border: "none", cursor: "pointer" }}>
          <span style={{ marginRight: 8, verticalAlign: "middle" }}>Sign in with Google</span>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ verticalAlign: "middle" }}><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 30.1 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-0.4-1-0.6-2-0.6-3.1s0.2-2.1 0.6-3.1C12.7 15.1 17.9 11 24 11c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-0.1-2.7-0.4-4z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 16.1 18.8 13 24 13c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 15.1 2 7.6 7.6 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.5 0 10.5-2.1 14.3-5.7l-6.6-5.4C29.9 34.9 27.1 36 24 36c-6.1 0-11.3-4.1-13.1-9.6l-6.6 5.1C7.6 40.4 15.1 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-4.1 5.5-7.3 5.5-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5c1.7 0 3.2 0.6 4.4 1.6l6.2-6.2C34.5 4.5 29.5 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-0.1-2.7-0.4-4z"/></g></svg>
        </button>
      )}
      {!loading && isSignedIn && user && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {user.imageUrl && <img src={user.imageUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%" }} />}
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: "0.95em", color: "#555" }}>{user.email}</div>
            <div style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 2 }}>Signed in with Google</div>
          </div>
        </div>
      )}
      {!loading && isSignedIn && (
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSignOut} style={{ marginRight: 8, padding: "0.5em 1.2em", fontSize: "1em", borderRadius: 8, background: "#eee", color: "#222", border: "none", cursor: "pointer" }}>
            Sign out
          </button>
          <button onClick={handleRefresh} style={{ padding: "0.5em 1.2em", fontSize: "1em", borderRadius: 8, background: "#4285F4", color: "#fff", border: "none", cursor: "pointer" }}>
            Refresh Events
          </button>
        </div>
      )}
    </div>
  );
} 
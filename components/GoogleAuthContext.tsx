"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface GoogleUser {
  name: string;
  email: string;
  imageUrl?: string;
}

interface GoogleAuthContextType {
  isSignedIn: boolean;
  user: GoogleUser | null;
  loading: boolean;
  accessToken: string | null;
  signIn: () => void;
  signOut: () => void;
  refresh: () => void;
  signInRequired: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

const CLIENT_ID = "512093380421-7rbbejhoj7gevce2rm2fo29r23l4h8qc.apps.googleusercontent.com";
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
    google?: any;
    __dot_gcal_token?: string;
  }
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const tokenClient = useRef<any>(null);
  const silentAuthTried = useRef(false);
  const gisReady = useRef(false);

  // Load GIS script and set ready flag
  useEffect(() => {
    loadGISScript(() => {
      gisReady.current = true;
      setLoading(false);
    });
  }, []);

  // Helper to initialize token client
  const initTokenClient = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) return;
    tokenClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          window.__dot_gcal_token = tokenResponse.access_token;
          setIsSignedIn(true);
          setSignInRequired(false);
          fetchUserInfo(tokenResponse.access_token);
          window.dispatchEvent(new Event("dot-gcal-token-updated"));
          localStorage.setItem("dot-gcal-signed-in", "1");
        } else {
          setIsSignedIn(false);
          setAccessToken(null);
          setUser(null);
          setSignInRequired(true);
          window.__dot_gcal_token = undefined;
          localStorage.removeItem("dot-gcal-signed-in");
        }
      },
    });
  };

  // Robust silent sign-in: retry after GIS loads, and on every mount
  useEffect(() => {
    const trySilentAuth = () => {
      if (!gisReady.current || !window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        setTimeout(trySilentAuth, 200); // Retry until GIS is ready
        return;
      }
      if (!tokenClient.current) {
        initTokenClient();
      }
      if (window.__dot_gcal_token) {
        setAccessToken(window.__dot_gcal_token);
        setIsSignedIn(true);
        setSignInRequired(false);
        fetchUserInfo(window.__dot_gcal_token);
      } else if (!silentAuthTried.current && localStorage.getItem("dot-gcal-signed-in")) {
        silentAuthTried.current = true;
        tokenClient.current.requestAccessToken({ prompt: "none" });
      } else {
        setSignInRequired(true);
      }
    };
    trySilentAuth();
    // Also retry on GIS script load
    if (gisReady.current) {
      trySilentAuth();
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUser({ name: data.name, email: data.email, imageUrl: data.picture });
    } catch (e) {
      setUser(null);
    }
  };

  const signIn = () => {
    if (!tokenClient.current) {
      initTokenClient();
    }
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
      localStorage.setItem("dot-gcal-signed-in", "1");
    }
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUser(null);
    setAccessToken(null);
    setSignInRequired(true);
    window.__dot_gcal_token = undefined;
    localStorage.removeItem("dot-gcal-signed-in");
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    window.dispatchEvent(new Event("dot-gcal-token-updated"));
  };

  const refresh = () => {
    if (accessToken) {
      fetchUserInfo(accessToken);
      window.dispatchEvent(new Event("dot-gcal-token-updated"));
    }
  };

  // Listen for token updates from other tabs/windows
  useEffect(() => {
    const handler = () => {
      if (window.__dot_gcal_token) {
        setAccessToken(window.__dot_gcal_token);
        setIsSignedIn(true);
        setSignInRequired(false);
        fetchUserInfo(window.__dot_gcal_token);
      } else {
        setAccessToken(null);
        setIsSignedIn(false);
        setUser(null);
        setSignInRequired(true);
      }
    };
    window.addEventListener("dot-gcal-token-updated", handler);
    return () => window.removeEventListener("dot-gcal-token-updated", handler);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ isSignedIn, user, loading, accessToken, signIn, signOut, refresh, signInRequired }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  return ctx;
} 
"use client";
import React, { useEffect, useState } from "react";

const CLIENT_ID = "512093380421-7rbbejhoj7gevce2rm2fo29r23l4h8qc.apps.googleusercontent.com"; // <-- Replace with your client ID
const API_KEY = ""; // Not required for most calendar operations
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const SCOPES = "https://www.googleapis.com/auth/calendar";

declare global {
  interface Window {
    gapi: any;
  }
}

export default function GoogleCalendarSync() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Load gapi
    function start() {
      window.gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        .then(() => {
          // Listen for sign-in state changes.
          window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
          // Handle the initial sign-in state.
          setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    }
    if (window.gapi) {
      window.gapi.load("client:auth2", start);
      setGapiLoaded(true);
    } else {
      // Wait for gapi to load if not present yet
      const interval = setInterval(() => {
        if (window.gapi) {
          window.gapi.load("client:auth2", start);
          setGapiLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Sign in/out handlers
  const handleSignIn = () => window.gapi.auth2.getAuthInstance().signIn();
  const handleSignOut = () => window.gapi.auth2.getAuthInstance().signOut();

  // Fetch events
  const fetchEvents = () => {
    window.gapi.client.calendar.events
      .list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: "startTime",
      })
      .then((response: any) => {
        setEvents(response.result.items || []);
      });
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [isSignedIn]);

  return (
    <div style={{ margin: "2em 0" }}>
      {!isSignedIn && gapiLoaded && (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
      {isSignedIn && (
        <>
          <button onClick={handleSignOut}>Sign out</button>
          <button onClick={fetchEvents} style={{ marginLeft: 8 }}>
            Refresh Events
          </button>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.summary}</strong>
                <br />
                {event.start?.dateTime || event.start?.date}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
} 
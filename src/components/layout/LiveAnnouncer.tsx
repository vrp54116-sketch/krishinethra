"use client";

import { useEffect, useState } from "react";
import { useFarmStore } from "@/lib/store";

/**
 * LiveAnnouncer — V2.5 accessibility.
 * Visually-hidden polite live region that announces pump state changes and
 * new alert notifications to screen readers. Subscribes to the zustand store
 * directly so announcements fire from the subscription callback (never from
 * a render/effect body).
 */
export default function LiveAnnouncer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initial = useFarmStore.getState();
    let prevRunning = initial.pump.running;
    let prevAlertCount = initial.alerts.length;

    const unsub = useFarmStore.subscribe((s) => {
      const running = s.pump.running;
      const alertCount = s.alerts.length;

      if (running !== prevRunning) {
        prevRunning = running;
        setMessage(running ? "Pump turned on" : "Pump turned off");
      }
      if (alertCount > prevAlertCount) {
        const newest = s.alerts[0];
        if (newest) setMessage(`New alert: ${newest.title}. ${newest.message}`);
      }
      prevAlertCount = alertCount;
    });

    return unsub;
  }, []);

  return (
    <div aria-live="polite" role="status" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

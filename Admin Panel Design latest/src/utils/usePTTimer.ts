import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/pt-timer`;

interface UsePTTimerOptions {
  transformerId: string;
  orderId: string;
  jobId: string;
  stage: 'pt_pretest' | 'pt';
  testerName: string;
  role: string;
  enabled: boolean; // false = skip timer (e.g. unit already approved/read-only)
}

interface UsePTTimerResult {
  timeLeftMs: number | null;  // null = not started yet
  isOverdue: boolean;
  expectedMinutes: number | null;
  endTimer: () => Promise<void>;
}

export function usePTTimer({
  transformerId,
  orderId,
  jobId,
  stage,
  testerName,
  role,
  enabled
}: UsePTTimerOptions): UsePTTimerResult {
  const [expectedMinutes, setExpectedMinutes] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  // Ref to store interval ID for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start timer on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !transformerId || !orderId || !stage) return;

    let cancelled = false;

    const startTimer = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/start`,
          { transformerId, orderId, jobId, stage },
          { withCredentials: true }
        );
        if (res.data.success && !cancelled) {
          const sTime = new Date(res.data.data.startTime);
          const expMin = res.data.data.expectedMinutes;
          setStartTime(sTime);
          setExpectedMinutes(expMin);
          // Initialise timeLeft immediately
          const expectedMs = expMin * 60 * 1000;
          const elapsed = Date.now() - sTime.getTime();
          setTimeLeftMs(expectedMs - elapsed);
        }
      } catch (err) {
        // Timer start failure is silent — never block the tester
        console.warn('[usePTTimer] Could not start timer:', err);
      }
    };

    startTimer();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformerId, stage, enabled]);

  // ── Tick interval — update timeLeftMs every second ────────────────────────
  useEffect(() => {
    if (!startTime || expectedMinutes === null || !enabled) return;

    const expectedMs = expectedMinutes * 60 * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.getTime();
      setTimeLeftMs(expectedMs - elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, expectedMinutes, enabled]);

  // ── End timer (called explicitly by parent on submit/approve) ─────────────
  const endTimer = useCallback(async () => {
    if (!enabled || !transformerId || !stage) return;

    // Stop the local tick
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await axios.post(
        `${API_BASE}/end`,
        { transformerId, stage },
        { withCredentials: true }
      );
    } catch (err) {
      // Silent — never block submission
      console.warn('[usePTTimer] Could not end timer:', err);
    }
  }, [transformerId, stage, enabled]);

  const isOverdue = timeLeftMs !== null && timeLeftMs < 0;

  return { timeLeftMs, isOverdue, expectedMinutes, endTimer };
}

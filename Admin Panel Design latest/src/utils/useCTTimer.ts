import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ct-timer`;

interface UseCTTimerOptions {
  transformerId: string;
  orderId: string;
  jobId: string;
  stage: 'core' | 'secondary' | 'after_primary' | 'final';
  testerName: string;
  role: string;
  coreCount?: number; // required for after_primary conditional logic
  enabled: boolean;
  autoStart?: boolean; // New option for manual start
}

interface UseCTTimerResult {
  timeLeftMs: number | null;
  isOverdue: boolean;
  expectedMinutes: number | null;
  endTimer: () => Promise<void>;
  startTimerManual: () => Promise<void>;
  completeCore: (coreId: string) => Promise<void>;
}

export function useCTTimer({
  transformerId,
  orderId,
  jobId,
  stage,
  testerName,
  role,
  coreCount = 1,
  enabled,
  autoStart = true
}: UseCTTimerOptions): UseCTTimerResult {
  const [expectedMinutes, setExpectedMinutes] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(async () => {
    if (!transformerId || !orderId || !stage) return;
    try {
      const res = await axios.post(
        `${API_BASE}/start`,
        { transformerId, orderId, jobId, stage, coreCount },
        { withCredentials: true }
      );
      if (res.data.success) {
        const sTime = new Date(res.data.data.startTime);
        const expMin = res.data.data.expectedMinutes;
        setStartTime(sTime);
        setExpectedMinutes(expMin);
        const expectedMs = expMin * 60 * 1000;
        const elapsed = Date.now() - sTime.getTime();
        setTimeLeftMs(expectedMs - elapsed);
      }
    } catch (err) {
      console.error('[CTTimer] Error starting timer manually:', err);
    }
  }, [transformerId, orderId, jobId, stage, coreCount]);

  // ── Start timer on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !autoStart || !transformerId || !orderId || !stage) return;

    let cancelled = false;

    const startTimerEffect = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/start`,
          { transformerId, orderId, jobId, stage, coreCount },
          { withCredentials: true }
        );
        if (res.data.success && !cancelled) {
          const sTime = new Date(res.data.data.startTime);
          const expMin = res.data.data.expectedMinutes;
          setStartTime(sTime);
          setExpectedMinutes(expMin);
          const expectedMs = expMin * 60 * 1000;
          const elapsed = Date.now() - sTime.getTime();
          setTimeLeftMs(expectedMs - elapsed);
        }
      } catch (err) {
        console.error('[CTTimer] Error starting timer:', err);
      }
    };

    startTimerEffect();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformerId, stage, enabled, coreCount]);

  // ── Tick interval ─────────────────────────────────────────────────────────
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

  // ── End timer ─────────────────────────────────────────────────────────────
  const endTimer = useCallback(async () => {
    if (!enabled || !transformerId || !stage) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state to immediately hide the UI badge
    setTimeLeftMs(null);

    try {
      await axios.post(
        `${API_BASE}/end`,
        { transformerId, stage },
        { withCredentials: true }
      );
    } catch (err) {
      console.warn('[useCTTimer] Could not end timer:', err);
    }
  }, [transformerId, stage, enabled]);

  const isOverdue = timeLeftMs !== null && timeLeftMs < 0;

  const completeCore = useCallback(async (coreId: string) => {
    if (!transformerId || !stage || !coreId) return;
    try {
      await axios.post(
        `${API_BASE}/complete-core`,
        { transformerId, stage, coreId },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('[CTTimer] Error completing core:', err);
    }
  }, [transformerId, stage]);

  return { timeLeftMs, isOverdue: timeLeftMs !== null && timeLeftMs <= 0, expectedMinutes, endTimer, startTimerManual: startTimer, completeCore };
}

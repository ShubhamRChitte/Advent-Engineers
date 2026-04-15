import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface TesterStats {
  activeTests: number;
  completedTests: number;
}

interface RecentActivity {
  id: string;
  jobId: string;
  client: string;
  status: string;
  time: string;
  details: string;
}

export function useTesterStats(role: string, userName: string) {
  const [stats, setStats] = useState<TesterStats>({ activeTests: 0, completedTests: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3002/api/dashboard/tester-stats`, {
        params: { role, userName },
        withCredentials: true
      });
      if (response.data.success) {
        setStats(response.data.stats);
        setRecentActivity(response.data.recentActivity);
      }
    } catch (err: any) {
      console.error("Error fetching tester stats:", err);
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [role, userName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, recentActivity, loading, error, refresh: fetchStats };
}

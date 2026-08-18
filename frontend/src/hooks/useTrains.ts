import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { Train } from '../api/types';

export function useTrains() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTrains();
      setTrains(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trains');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  return { trains, loading, error, refetch: fetchTrains };
}

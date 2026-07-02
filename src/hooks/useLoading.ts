import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  const execute = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await action();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, startLoading, stopLoading, execute };
}

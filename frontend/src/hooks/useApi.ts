import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const currentRequestId = useRef(0);

  const execute = useCallback(async (endpoint: string, options?: RequestInit) => {
    const requestId = ++currentRequestId.current;
    
    setIsIdle(false);
    setIsLoading(true);
    setError(null);
    setData(null);
    
    const result = await apiFetch<T>(endpoint, options);
    
    // Ignore if a newer request has been made
    if (requestId !== currentRequestId.current) {
      return result;
    }
    
    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }
    
    setIsLoading(false);
    return result;
  }, []);

  return { data, error, isLoading, isIdle, execute, setError };
}

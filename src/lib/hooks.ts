/**
 * API 调用 Hook
 * 封装 API 调用，自动处理加载状态和错误提示
 */

import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showErrorToast?: boolean;
}

interface UseApiReturn<T, P extends any[]> {
  execute: (...params: P) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
}

/**
 * 封装异步 API 调用的 Hook
 */
export function useApi<T, P extends any[]>(
  apiFn: (...params: P) => Promise<{ success: boolean; data?: T; error?: { message: string }; message?: string }>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const { onSuccess, onError, showErrorToast = true } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const toast = useToast();

  const execute = useCallback(async (...params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFn(...params);

      if (response.success) {
        setData(response.data || null);
        onSuccess?.(response.data as T);
        return response.data as T;
      } else {
        const errorMessage = response.error?.message || '操作失败';
        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        onError?.(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = '网络错误，请稍后重试';
      setError(errorMessage);

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError, showErrorToast, toast]);

  return { execute, loading, error, data };
}

/**
 * 用于列表数据的 Hook
 */
export function useListApi<T, P extends any[]>(
  apiFn: (...params: P) => Promise<{ success: boolean; data?: { list: T[]; total: number }; error?: { message: string } }>,
  options: UseApiOptions<{ list: T[]; total: number }> = {}
) {
  const [list, setList] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetch = useCallback(async (...params: P): Promise<boolean> => {
    setLoading(true);

    try {
      const response = await apiFn(...params);

      if (response.success && response.data) {
        setList(response.data.list);
        setTotal(response.data.total);
        options.onSuccess?.(response.data);
        return true;
      } else {
        const errorMessage = response.error?.message || '获取数据失败';
        if (options.showErrorToast !== false) {
          toast.error(errorMessage);
        }
        options.onError?.(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = '网络错误，请稍后重试';
      if (options.showErrorToast !== false) {
        toast.error(errorMessage);
      }
      options.onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiFn, options, toast]);

  return { list, total, loading, fetch, setList };
}
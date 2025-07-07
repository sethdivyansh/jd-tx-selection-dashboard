'use client';

import { useState, useEffect, useCallback } from 'react';

export interface JobHistoryItem {
  id: number;
  template_id: number;
  channel_id: number;
  request_id: number;
  job_id: number;
  mining_job_token: string;
  created_at: string;
  updated_at: string;
  txid_count: number;
}

export interface JobHistoryResponse {
  success: boolean;
  data: {
    jobs: JobHistoryItem[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface JobTxidsResponse {
  success: boolean;
  data: {
    template_id: number;
    txids: string[];
    total: number;
  };
}

export interface UseJobHistoryOptions {
  page?: number;
  per_page?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useJobHistory(options: UseJobHistoryOptions = {}) {
  const { page = 1, per_page = 10 } = options;

  const [data, setData] = useState<JobHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString()
      });

      const response = await fetch(
        `http://localhost:3001/api/job-history?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: JobHistoryResponse = await response.json();

      if (!result.success) {
        throw new Error('Failed to fetch job history');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, per_page]);

  useEffect(() => {
    fetchJobHistory();
  }, [fetchJobHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchJobHistory
  };
}

export function useJobTxids(templateId: number | null) {
  const [data, setData] = useState<JobTxidsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobTxids = useCallback(async () => {
    if (!templateId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/job-txids/${templateId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: JobTxidsResponse = await response.json();

      if (!result.success) {
        throw new Error('Failed to fetch job txids');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchJobTxids();
  }, [fetchJobTxids]);

  return {
    data,
    loading,
    error,
    refetch: fetchJobTxids
  };
}

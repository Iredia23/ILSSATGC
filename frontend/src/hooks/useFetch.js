import { useState, useEffect, useCallback } from "react";
import api from "../utils/api.js";

/**
 * Custom hook for fetching data from API
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 * @param {boolean} immediate - Fetch immediately on mount
 */
export const useFetch = (url, params = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchData = useCallback(async (customParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const allParams = { ...params, ...customParams };
      const res = await api.get(url, { params: allParams });
      setData(res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch data";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, pagination, refetch: fetchData, setData };
};

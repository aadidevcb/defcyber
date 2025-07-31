import { useState, useEffect } from 'react';
import { request } from 'graphql-request';
import { gql } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";

export default function useFetchGraphQL(QUERY, variables = {}, { refetchInterval } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stringifiedVariables = JSON.stringify(variables);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = GRAPHQL_URL;
        const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const result = await request(endpoint, QUERY, variables, headers);
        console.log("Fetched data:", result);
        setData(result);
      } catch (err) {
        console.error("GraphQL fetch error:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (refetchInterval) {
      const intervalId = setInterval(fetchData, refetchInterval);
      return () => clearInterval(intervalId);
    }
  }, [QUERY, stringifiedVariables, refetchInterval]);

  return { data, loading, error };
}
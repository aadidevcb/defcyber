import { useState, useEffect } from 'react';
import { request } from 'graphql-request';
import { gql } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";

export default function useFetchGraphQL(variables = {}) {
const QUERY=gql`query{
    checkFileHash{
      exists
    }
    getOutput{
      count
    }
    getPorts{
      openPorts
    }
  }`;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = GRAPHQL_URL;
        const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const result = await request(endpoint, QUERY, variables, headers);
        setData(result);
      } catch (err) {
        console.error("GraphQL fetch error:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [QUERY, JSON.stringify(variables)]);

  return { data, loading, error };
}
import { useState } from "react";

export default function useFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (
    url: string,
    options?: RequestInit
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, options);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;

    } catch (err: any) {
      setError(err.message);
      throw err;

    } finally {
      setLoading(false);
    }
  };

  return {
    request,
    loading,
    error,
  };
}
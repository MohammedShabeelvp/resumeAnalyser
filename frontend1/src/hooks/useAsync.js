import { useState, useCallback } from "react";

export default function useAsync(asyncFn) {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setStatus("loading");
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        setStatus("success");
        return result;
      } catch (err) {
        const message = err.response?.data?.error || err.message || "Something went wrong";
        setError(message);
        setStatus("error");
        throw err;
      }
    },
    [asyncFn]
  );

  const reset = () => {
    setStatus("idle");
    setData(null);
    setError(null);
  };

  return {
    execute,
    data,
    error,
    reset,
    isIdle: status === "idle",
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
  };
}

import { useEffect, useState } from "react";
import { fetchData } from "./api";

// The key check also hides previous results before an effect starts. This prevents
// a new station title from ever being paired with the previous station's data.
export function useResource(url, revision = 0) {
  const key = url ? `${url}|${revision}` : null;
  const [state, setState] = useState({
    key: null,
    data: null,
    error: null,
    loading: false,
  });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ key, data: null, error: null, loading: true });
    fetchData(url, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ key, data, error: null, loading: false });
      },
      (error) => {
        if (!controller.signal.aborted)
          setState({ key, data: null, error: error.message, loading: false });
      },
    );
    return () => controller.abort();
  }, [url, key]);
  if (!key) return { data: null, error: null, loading: false };
  if (state.key !== key) return { data: null, error: null, loading: true };
  return state;
}

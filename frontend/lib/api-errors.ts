import axios from "axios";

/** True when the backend has not deployed Link Intelligence routes yet. */
export function isIntelligenceUnavailable(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 501)
  );
}

/** Skip optional intelligence steps when auth or routes are unavailable. */
export function isSkippableIntelligenceError(error: unknown): boolean {
  return (
    isIntelligenceUnavailable(error) ||
    (axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403))
  );
}

import axios from "axios";

/** True when the backend has not deployed Link Intelligence routes yet. */
export function isIntelligenceUnavailable(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 501)
  );
}

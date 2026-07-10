import type { ApiErrorBody, CalculateRequest, CalculateResponse } from "../types/calculator";

// Overridable at build/run time (see docker-compose.yml and .env.example)
// so the same bundle can point at different backend origins.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * Distinguishes calculator-domain failures (validation, division by zero,
 * network issues) from unexpected exceptions, so the UI can render a clean
 * message instead of a stack trace.
 */
export class CalculatorApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CalculatorApiError";
    this.status = status;
  }
}

export async function calculate(request: CalculateRequest): Promise<number> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new CalculatorApiError(
      "Could not reach the calculator service. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const body: ApiErrorBody | null = await response.json().catch(() => null);
    throw new CalculatorApiError(
      body?.error ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const data: CalculateResponse = await response.json();
  return data.result;
}

/**
 * Shared calculator types. These mirror the backend's contract
 * (see backend/internal/calculator and backend/internal/httpapi) so a
 * mismatch between frontend and backend surfaces as a TypeScript error
 * instead of a runtime bug.
 */

export const OPERATIONS = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
  "sqrt",
  "percentage",
] as const;

export type Operation = (typeof OPERATIONS)[number];

/** Operations that only need the first operand ("a"). */
const UNARY_OPERATIONS: ReadonlySet<Operation> = new Set(["sqrt"]);

export function requiresSecondOperand(operation: Operation): boolean {
  return !UNARY_OPERATIONS.has(operation);
}

export interface CalculateRequest {
  operation: Operation;
  a: number;
  b?: number;
}

export interface CalculateResponse {
  result: number;
}

export interface ApiErrorBody {
  error: string;
}

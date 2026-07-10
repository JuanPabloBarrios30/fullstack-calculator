import { requiresSecondOperand, type Operation } from "../types/calculator";

/**
 * Client-side validation is a UX convenience only — it mirrors a subset of
 * the backend's rules so the user gets instant feedback, but the backend
 * remains the source of truth and re-validates every request.
 */
export function parseOperand(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function validateOperands(
  operation: Operation,
  aRaw: string,
  bRaw: string,
): string | null {
  const a = parseOperand(aRaw);
  if (a === null) {
    return 'Enter a valid number for "a".';
  }

  if (requiresSecondOperand(operation)) {
    const b = parseOperand(bRaw);
    if (b === null) {
      return 'Enter a valid number for "b".';
    }
    if (operation === "divide" && b === 0) {
      return "Cannot divide by zero.";
    }
  }

  if (operation === "sqrt" && a < 0) {
    return "Cannot calculate the square root of a negative number.";
  }

  return null;
}

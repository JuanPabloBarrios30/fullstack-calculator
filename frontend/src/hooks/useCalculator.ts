import { useCallback, useEffect, useRef, useState } from "react";
import { calculate, CalculatorApiError } from "../api/calculatorApi";
import { requiresSecondOperand, type CalculateRequest, type Operation } from "../types/calculator";

const OPERATOR_SYMBOL: Record<Operation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
  power: "xʸ",
  sqrt: "√",
  percentage: "%",
};

function trimmed(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(10))) : String(value);
}

/**
 * Drives the calculator display as a small state machine. Every arithmetic
 * step (each chained operator press, sqrt, percentage, equals) calls the
 * backend rather than computing locally — the API is the source of truth,
 * the frontend just accumulates the running expression for display.
 */
export function useCalculator() {
  const [display, setDisplay] = useState("0");
  const [trail, setTrail] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOperator, setActiveOperator] = useState<Operation | null>(null);

  // Calculation bookkeeping that's only ever read right before firing the
  // next API call, so it doesn't need to live in React state.
  const previousRef = useRef<number | null>(null);
  const operatorRef = useRef<Operation | null>(null);
  const justEvaluatedRef = useRef(false);

  const runCalculation = useCallback(async (operation: Operation, a: number, b: number): Promise<number | null> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const request: CalculateRequest = requiresSecondOperand(operation) ? { operation, a, b } : { operation, a };
      return await calculate(request);
    } catch (error) {
      setErrorMessage(
        error instanceof CalculatorApiError ? error.message : "Something went wrong. Please try again.",
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const inputDigit = useCallback((digit: string) => {
    setErrorMessage(null);
    if (justEvaluatedRef.current) {
      justEvaluatedRef.current = false;
      setTrail([]);
      setDisplay(digit === "." ? "0." : digit);
      return;
    }
    setDisplay((current) => {
      if (digit === "." && current.includes(".")) return current;
      return current === "0" && digit !== "." ? digit : current + digit;
    });
  }, []);

  const inputOperator = useCallback(
    async (operation: Operation) => {
      const currentValue = parseFloat(display);

      if (previousRef.current !== null && operatorRef.current && !justEvaluatedRef.current) {
        const result = await runCalculation(operatorRef.current, previousRef.current, currentValue);
        if (result === null) return;
        previousRef.current = result;
        setTrail((tokens) => [...tokens, display, OPERATOR_SYMBOL[operation]]);
      } else {
        previousRef.current = currentValue;
        setTrail([display, OPERATOR_SYMBOL[operation]]);
      }

      operatorRef.current = operation;
      justEvaluatedRef.current = false;
      setActiveOperator(operation);
      setDisplay("0");
    },
    [display, runCalculation],
  );

  const equals = useCallback(async () => {
    if (operatorRef.current === null || previousRef.current === null) return;

    const currentValue = parseFloat(display);
    const result = await runCalculation(operatorRef.current, previousRef.current, currentValue);
    if (result === null) return;

    setTrail((tokens) => [...tokens, display, "="]);
    setDisplay(trimmed(result));
    previousRef.current = null;
    operatorRef.current = null;
    justEvaluatedRef.current = true;
    setActiveOperator(null);
  }, [display, runCalculation]);

  const sqrt = useCallback(async () => {
    const value = parseFloat(display);
    const result = await runCalculation("sqrt", value, 0);
    if (result === null) return;

    setTrail([`√(${trimmed(value)})`]);
    setDisplay(trimmed(result));
    justEvaluatedRef.current = true;
  }, [display, runCalculation]);

  const percentage = useCallback(async () => {
    const value = parseFloat(display);

    // Mirrors the common calculator convention (e.g. iOS): with a pending
    // operation, "%" expresses the current entry as a percentage of the
    // accumulated value, via the backend's "a percent of b" contract. With
    // no pending operation there's no second operand to send, so it's just
    // a decimal shift rather than a round trip to the API.
    if (previousRef.current !== null) {
      const result = await runCalculation("percentage", value, previousRef.current);
      if (result === null) return;
      setDisplay(trimmed(result));
    } else {
      setDisplay(trimmed(value / 100));
    }
  }, [display, runCalculation]);

  const clear = useCallback(() => {
    setDisplay("0");
    setTrail([]);
    setErrorMessage(null);
    previousRef.current = null;
    operatorRef.current = null;
    justEvaluatedRef.current = false;
    setActiveOperator(null);
  }, []);

  const backspace = useCallback(() => {
    if (justEvaluatedRef.current) return;
    setDisplay((current) => (current.length > 1 ? current.slice(0, -1) : "0"));
  }, []);

  useEffect(() => {
    const operatorKeys: Record<string, Operation> = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };

    function handleKeyDown(event: KeyboardEvent) {
      if (/^[0-9]$/.test(event.key) || event.key === ".") {
        inputDigit(event.key);
      } else if (operatorKeys[event.key]) {
        void inputOperator(operatorKeys[event.key]);
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        void equals();
      } else if (event.key === "Backspace") {
        backspace();
      } else if (event.key === "Escape") {
        clear();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputDigit, inputOperator, equals, backspace, clear]);

  return {
    display,
    trail,
    isLoading,
    errorMessage,
    activeOperator,
    inputDigit,
    inputOperator,
    equals,
    sqrt,
    percentage,
    clear,
    backspace,
  };
}

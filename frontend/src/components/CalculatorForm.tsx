import { useState, type FormEvent } from "react";
import {
  OPERATIONS,
  OPERATION_LABELS,
  requiresSecondOperand,
  type CalculateRequest,
  type Operation,
} from "../types/calculator";
import { validateOperands } from "../utils/calculatorValidation";

interface CalculatorFormProps {
  onSubmit: (request: CalculateRequest) => void;
  isSubmitting: boolean;
}

export function CalculatorForm({ onSubmit, isSubmitting }: CalculatorFormProps) {
  const [operation, setOperation] = useState<Operation>("add");
  const [aInput, setAInput] = useState("");
  const [bInput, setBInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const needsSecondOperand = requiresSecondOperand(operation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateOperands(operation, aInput, needsSecondOperand ? bInput : "0");
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onSubmit({
      operation,
      a: Number(aInput),
      ...(needsSecondOperand ? { b: Number(bInput) } : {}),
    });
  }

  return (
    <form className="calculator-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="operation">Operation</label>
        <select
          id="operation"
          value={operation}
          onChange={(event) => setOperation(event.target.value as Operation)}
        >
          {OPERATIONS.map((op) => (
            <option key={op} value={op}>
              {OPERATION_LABELS[op]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="operand-a">a</label>
        <input
          id="operand-a"
          type="number"
          inputMode="decimal"
          step="any"
          value={aInput}
          onChange={(event) => setAInput(event.target.value)}
          placeholder="e.g. 10"
        />
      </div>

      {needsSecondOperand && (
        <div className="field">
          <label htmlFor="operand-b">b</label>
          <input
            id="operand-b"
            type="number"
            inputMode="decimal"
            step="any"
            value={bInput}
            onChange={(event) => setBInput(event.target.value)}
            placeholder="e.g. 2"
          />
        </div>
      )}

      {validationError && (
        <p className="field-error" role="alert">
          {validationError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Calculating…" : "Calculate"}
      </button>
    </form>
  );
}

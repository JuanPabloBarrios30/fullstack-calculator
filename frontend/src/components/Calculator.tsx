import { useCalculator } from "../hooks/useCalculator";
import type { Operation } from "../types/calculator";
import "./Calculator.css";

export function Calculator() {
  const {
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
  } = useCalculator();

  function operatorClass(operation: Operation): string {
    return activeOperator === operation ? "key op active" : "key op";
  }

  function digitButton(digit: string) {
    return (
      <button className="key" onClick={() => inputDigit(digit)} disabled={isLoading}>
        {digit}
      </button>
    );
  }

  return (
    <div className="device">
      <div className="screen">
        <p className={errorMessage ? "error-pill visible" : "error-pill"} role="alert">
          {errorMessage}
        </p>
        <p className="trail">{trail.length ? trail.join(" ") : " "}</p>
        <p className="readout" data-testid="calculator-display" aria-live="polite">
          {display}
        </p>
      </div>

      <div className="keypad">
        <button className="key fn" onClick={clear} disabled={isLoading}>
          AC
        </button>
        <button className="key fn" onClick={backspace} disabled={isLoading} aria-label="Delete last digit">
          ⌫
        </button>
        <button className="key fn" onClick={() => void percentage()} disabled={isLoading} title="Percentage">
          %
        </button>
        <button
          className={operatorClass("divide")}
          onClick={() => void inputOperator("divide")}
          disabled={isLoading}
          aria-label="Divide"
        >
          ÷
        </button>

        {digitButton("7")}
        {digitButton("8")}
        {digitButton("9")}
        <button
          className={operatorClass("multiply")}
          onClick={() => void inputOperator("multiply")}
          disabled={isLoading}
          aria-label="Multiply"
        >
          ×
        </button>

        {digitButton("4")}
        {digitButton("5")}
        {digitButton("6")}
        <button
          className={operatorClass("subtract")}
          onClick={() => void inputOperator("subtract")}
          disabled={isLoading}
          aria-label="Subtract"
        >
          −
        </button>

        {digitButton("1")}
        {digitButton("2")}
        {digitButton("3")}
        <button
          className={operatorClass("add")}
          onClick={() => void inputOperator("add")}
          disabled={isLoading}
          aria-label="Add"
        >
          +
        </button>

        <button className="key fn" onClick={() => void sqrt()} disabled={isLoading} title="Square root">
          √
        </button>
        <button
          className={operatorClass("power")}
          onClick={() => void inputOperator("power")}
          disabled={isLoading}
          title="Power"
        >
          xʸ
        </button>
        {digitButton("0")}
        {digitButton(".")}

        <button className="key equals" onClick={() => void equals()} disabled={isLoading}>
          {isLoading ? "…" : "="}
        </button>
      </div>
    </div>
  );
}

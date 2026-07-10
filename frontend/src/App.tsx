import { useState } from "react";
import { CalculatorForm } from "./components/CalculatorForm";
import { calculate, CalculatorApiError } from "./api/calculatorApi";
import type { CalculateRequest } from "./types/calculator";
import "./App.css";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: number }
  | { status: "error"; message: string };

function App() {
  const [state, setState] = useState<RequestState>({ status: "idle" });

  async function handleSubmit(request: CalculateRequest) {
    setState({ status: "loading" });
    try {
      const result = await calculate(request);
      setState({ status: "success", result });
    } catch (error) {
      const message =
        error instanceof CalculatorApiError
          ? error.message
          : "Something went wrong. Please try again.";
      setState({ status: "error", message });
    }
  }

  return (
    <main className="app">
      <h1>Calculator</h1>

      <CalculatorForm onSubmit={handleSubmit} isSubmitting={state.status === "loading"} />

      <div className="result-panel" aria-live="polite">
        {state.status === "success" && (
          <p className="result">
            Result: <strong>{state.result}</strong>
          </p>
        )}
        {state.status === "error" && (
          <p className="result-error" role="alert">
            {state.message}
          </p>
        )}
      </div>
    </main>
  );
}

export default App;

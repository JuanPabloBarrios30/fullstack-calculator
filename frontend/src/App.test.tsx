import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { calculate, CalculatorApiError } from "./api/calculatorApi";

vi.mock("./api/calculatorApi", async () => {
  const actual = await vi.importActual<typeof import("./api/calculatorApi")>(
    "./api/calculatorApi",
  );
  return {
    ...actual,
    calculate: vi.fn(),
  };
});

const mockedCalculate = vi.mocked(calculate);

describe("App", () => {
  it("renders the calculated result on success", async () => {
    mockedCalculate.mockResolvedValue(7);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("a"), "3");
    await user.type(screen.getByLabelText("b"), "4");
    await user.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/Result:/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the API error message when the backend rejects an otherwise valid request", async () => {
    // Client-side validation doesn't catch overflow (e.g. an extreme power),
    // so this exercises the server-error path end to end.
    mockedCalculate.mockRejectedValue(
      new CalculatorApiError("result is not a finite number", 422),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Operation"), "power");
    await user.type(screen.getByLabelText("a"), "10");
    await user.type(screen.getByLabelText("b"), "400");
    await user.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("result is not a finite number");
  });
});

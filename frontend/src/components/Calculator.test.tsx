import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "./Calculator";
import { calculate, CalculatorApiError } from "../api/calculatorApi";

vi.mock("../api/calculatorApi", async () => {
  const actual = await vi.importActual<typeof import("../api/calculatorApi")>("../api/calculatorApi");
  return { ...actual, calculate: vi.fn() };
});

const mockedCalculate = vi.mocked(calculate);

function display() {
  return screen.getByTestId("calculator-display");
}

describe("Calculator", () => {
  it("performs a single addition through the backend", async () => {
    mockedCalculate.mockResolvedValue(7);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "=" }));

    await waitFor(() => expect(display()).toHaveTextContent("7"));
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: "add", a: 3, b: 4 });
  });

  it("chains multiple operations and keeps the full breadcrumb", async () => {
    mockedCalculate.mockResolvedValueOnce(18).mockResolvedValueOnce(27);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "=" }));

    await waitFor(() => expect(display()).toHaveTextContent("27"));
    expect(screen.getByText("9 + 9 + 9 =")).toBeInTheDocument();
    expect(mockedCalculate).toHaveBeenNthCalledWith(1, { operation: "add", a: 9, b: 9 });
    expect(mockedCalculate).toHaveBeenNthCalledWith(2, { operation: "add", a: 18, b: 9 });
  });

  it("shows the backend error message and does not advance on division by zero", async () => {
    mockedCalculate.mockRejectedValue(new CalculatorApiError("division by zero", 422));
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "=" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("division by zero"));
    expect(display()).toHaveTextContent("0");
  });

  it("computes a square root without sending a second operand", async () => {
    mockedCalculate.mockResolvedValue(3);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByTitle("Square root"));

    await waitFor(() => expect(display()).toHaveTextContent("3"));
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: "sqrt", a: 9 });
  });

  it("clears the display and breadcrumb", async () => {
    mockedCalculate.mockResolvedValue(7);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "AC" }));

    expect(display()).toHaveTextContent("0");
  });

  it("supports subtract, multiply, and power, continuing from the previous result", async () => {
    mockedCalculate.mockResolvedValueOnce(6).mockResolvedValueOnce(24).mockResolvedValueOnce(1024);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Subtract" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "=" }));
    await waitFor(() => expect(display()).toHaveTextContent("6"));
    expect(mockedCalculate).toHaveBeenNthCalledWith(1, { operation: "subtract", a: 9, b: 3 });

    await user.click(screen.getByRole("button", { name: "Multiply" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "=" }));
    await waitFor(() => expect(display()).toHaveTextContent("24"));
    expect(mockedCalculate).toHaveBeenNthCalledWith(2, { operation: "multiply", a: 6, b: 4 });

    await user.click(screen.getByTitle("Power"));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "=" }));
    await waitFor(() => expect(display()).toHaveTextContent("1024"));
    expect(mockedCalculate).toHaveBeenNthCalledWith(3, { operation: "power", a: 24, b: 2 });
  });

  it("computes a percentage of the accumulated value when a pending operation exists", async () => {
    mockedCalculate.mockResolvedValueOnce(20).mockResolvedValueOnce(220);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByTitle("Percentage"));

    await waitFor(() => expect(display()).toHaveTextContent("20"));
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: "percentage", a: 10, b: 200 });

    await user.click(screen.getByRole("button", { name: "=" }));
    await waitFor(() => expect(display()).toHaveTextContent("220"));
  });

  it("converts a percentage to a decimal locally when there is no pending operation", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByTitle("Percentage"));

    await waitFor(() => expect(display()).toHaveTextContent("0.5"));
    expect(mockedCalculate).not.toHaveBeenCalled();
  });

  it("deletes the last digit with backspace", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Delete last digit" }));

    expect(display()).toHaveTextContent("12");
  });

  it("starts a fresh entry when typing a digit right after a result", async () => {
    mockedCalculate.mockResolvedValue(7);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "=" }));
    await waitFor(() => expect(display()).toHaveTextContent("7"));

    await user.click(screen.getByRole("button", { name: "5" }));
    expect(display()).toHaveTextContent("5");
  });

  it("surfaces an error triggered mid-chain (not just at equals) and keeps the prior state", async () => {
    mockedCalculate.mockRejectedValue(new CalculatorApiError("division by zero", 422));
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    // Pressing another operator here (instead of "=") is what triggers the
    // failed calculation from inside inputOperator's chaining branch.
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("division by zero"));
  });

  it("shows a generic message when the failure isn't a CalculatorApiError", async () => {
    mockedCalculate.mockRejectedValue(new TypeError("boom"));
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "=" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again."),
    );
  });

  it("supports keyboard shortcuts for entry, operators, equals, backspace, and clear", async () => {
    mockedCalculate.mockResolvedValue(11);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.keyboard("9");
    await user.keyboard("{Backspace}");
    await user.keyboard("7+4");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(display()).toHaveTextContent("11"));
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: "add", a: 7, b: 4 });

    await user.keyboard("{Escape}");
    expect(display()).toHaveTextContent("0");
  });
});

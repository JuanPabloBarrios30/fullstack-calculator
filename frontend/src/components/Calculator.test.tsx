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
});

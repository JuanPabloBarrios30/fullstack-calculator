import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorForm } from "./CalculatorForm";

describe("CalculatorForm", () => {
  it("renders operand a and the operation select, with add selected by default", () => {
    render(<CalculatorForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByLabelText("Operation")).toHaveValue("add");
    expect(screen.getByLabelText("a")).toBeInTheDocument();
    expect(screen.getByLabelText("b")).toBeInTheDocument();
  });

  it("hides the b field for the unary sqrt operation", async () => {
    const user = userEvent.setup();
    render(<CalculatorForm onSubmit={vi.fn()} isSubmitting={false} />);

    await user.selectOptions(screen.getByLabelText("Operation"), "sqrt");

    expect(screen.queryByLabelText("b")).not.toBeInTheDocument();
  });

  it("shows a validation error and does not submit when a is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CalculatorForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText("b"), "3");
    await user.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/"a"/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid binary request", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CalculatorForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText("a"), "10");
    await user.type(screen.getByLabelText("b"), "4");
    await user.click(screen.getByRole("button", { name: /calculate/i }));

    expect(onSubmit).toHaveBeenCalledWith({ operation: "add", a: 10, b: 4 });
  });

  it("submits a valid unary request without a b field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CalculatorForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.selectOptions(screen.getByLabelText("Operation"), "sqrt");
    await user.type(screen.getByLabelText("a"), "9");
    await user.click(screen.getByRole("button", { name: /calculate/i }));

    expect(onSubmit).toHaveBeenCalledWith({ operation: "sqrt", a: 9 });
  });

  it("disables the submit button while isSubmitting is true", () => {
    render(<CalculatorForm onSubmit={vi.fn()} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /calculating/i })).toBeDisabled();
  });
});

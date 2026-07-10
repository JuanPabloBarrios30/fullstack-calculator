import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the calculator with an initial display of 0", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Calculator" })).toBeInTheDocument();
    expect(screen.getByTestId("calculator-display")).toHaveTextContent("0");
  });
});

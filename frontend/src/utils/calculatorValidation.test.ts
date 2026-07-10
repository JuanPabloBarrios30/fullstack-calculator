import { describe, expect, it } from "vitest";
import { parseOperand, validateOperands } from "./calculatorValidation";

describe("parseOperand", () => {
  it("parses a valid numeric string", () => {
    expect(parseOperand("42")).toBe(42);
    expect(parseOperand("-3.5")).toBe(-3.5);
  });

  it("returns null for an empty string", () => {
    expect(parseOperand("")).toBeNull();
    expect(parseOperand("   ")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseOperand("abc")).toBeNull();
  });
});

describe("validateOperands", () => {
  it("accepts valid inputs for a binary operation", () => {
    expect(validateOperands("add", "2", "3")).toBeNull();
  });

  it("accepts a valid input for a unary operation without b", () => {
    expect(validateOperands("sqrt", "9", "")).toBeNull();
  });

  it("rejects a missing or invalid a", () => {
    expect(validateOperands("add", "", "3")).toMatch(/"a"/);
    expect(validateOperands("add", "abc", "3")).toMatch(/"a"/);
  });

  it("rejects a missing or invalid b for a binary operation", () => {
    expect(validateOperands("add", "2", "")).toMatch(/"b"/);
    expect(validateOperands("add", "2", "abc")).toMatch(/"b"/);
  });

  it("rejects division by zero", () => {
    expect(validateOperands("divide", "10", "0")).toMatch(/divide by zero/);
  });

  it("rejects the square root of a negative number", () => {
    expect(validateOperands("sqrt", "-4", "")).toMatch(/negative number/);
  });
});

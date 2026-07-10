import { afterEach, describe, expect, it, vi } from "vitest";
import { calculate, CalculatorApiError } from "./calculatorApi";

function mockFetchOnce(response: Partial<Response> & { json: () => Promise<unknown> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      ...response,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calculate", () => {
  it("returns the result on a successful response", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ result: 5 }) });

    const result = await calculate({ operation: "add", a: 2, b: 3 });

    expect(result).toBe(5);
  });

  it("throws a CalculatorApiError with the server's message on a 4xx/5xx response", async () => {
    mockFetchOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: "division by zero" }),
    });

    await expect(calculate({ operation: "divide", a: 1, b: 0 })).rejects.toMatchObject({
      message: "division by zero",
      status: 422,
    });
  });

  it("throws a CalculatorApiError when the network request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(calculate({ operation: "add", a: 1, b: 2 })).rejects.toBeInstanceOf(
      CalculatorApiError,
    );
  });
});

import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("CORS Integration Tests", () => {
  it("should respond with appropriate CORS headers to a preflight request", async () => {
    const response = await SELF.fetch("http://local.test/tasks", {
      method: "OPTIONS",
      headers: {
        "Origin": "http://example.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    expect(response.status).toBe(204); // No Content
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).not.toBeNull();
    expect(response.headers.get("Access-Control-Allow-Headers")).not.toBeNull();
  });

  it("should include CORS headers in actual responses", async () => {
    const response = await SELF.fetch("http://local.test/tasks", {
      method: "GET",
      headers: {
        "Origin": "http://example.com",
      },
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

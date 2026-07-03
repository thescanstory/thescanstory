import { afterEach, describe, expect, it, vi } from "vitest";
import { isEmailConfigured, sendShippedNotification } from "./notify";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("isEmailConfigured", () => {
  it("is false when unset", () => {
    delete process.env.RESEND_API_KEY;
    expect(isEmailConfigured()).toBe(false);
  });

  it("is false for the placeholder key", () => {
    process.env.RESEND_API_KEY = "re_xxxxxxxxxxxx";
    expect(isEmailConfigured()).toBe(false);
  });

  it("is false for a key that doesn't start with re_", () => {
    process.env.RESEND_API_KEY = "sk_liveSomethingElse";
    expect(isEmailConfigured()).toBe(false);
  });

  it("is true for a real-looking key", () => {
    process.env.RESEND_API_KEY = "re_live_realkey123";
    expect(isEmailConfigured()).toBe(true);
  });
});

describe("sendShippedNotification", () => {
  it("falls back to a console stub — never throws — when no key is configured", async () => {
    delete process.env.RESEND_API_KEY;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      sendShippedNotification({
        email: "customer@example.com",
        phone: "9876543210",
        experienceUrl: "https://example.com/experience/abc123",
      })
    ).resolves.toBeUndefined();

    const logged = logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(logged).toContain("SMS STUB");
    expect(logged).toContain("EMAIL STUB");
    expect(logged).toContain("customer@example.com");
    expect(logged).toContain("https://example.com/experience/abc123");
  });
});

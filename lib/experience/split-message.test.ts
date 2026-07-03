import { describe, expect, it } from "vitest";
import { splitMessage } from "./split-message";

describe("splitMessage", () => {
  it("treats a short single-line message as the heading with no body", () => {
    expect(splitMessage("Arav & Arya")).toEqual({ heading: "Arav & Arya", body: "" });
  });

  it("falls back to a generic heading for a long single-line message", () => {
    const long = "a".repeat(100);
    const result = splitMessage(long);
    expect(result.heading).toBe("A Story For You");
    expect(result.body).toBe(long);
  });

  it("splits a short first line from the rest as heading + body", () => {
    const message = "Arav & Arya\nHappy anniversary, we love you both.";
    expect(splitMessage(message)).toEqual({
      heading: "Arav & Arya",
      body: "Happy anniversary, we love you both.",
    });
  });

  it("falls back to a generic heading when the first line is too long", () => {
    const firstLine = "a".repeat(100);
    const message = `${firstLine}\nrest of the message`;
    const result = splitMessage(message);
    expect(result.heading).toBe("A Story For You");
    expect(result.body).toBe(message);
  });

  it("falls back to a generic heading when the first line is blank", () => {
    const message = "\nJust the body, no name given.";
    const result = splitMessage(message);
    expect(result.heading).toBe("A Story For You");
  });
});

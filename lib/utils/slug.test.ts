import { describe, expect, it } from "vitest";
import { generateExperienceSlug } from "./slug";

describe("generateExperienceSlug", () => {
  it("generates a 10-character slug", () => {
    expect(generateExperienceSlug()).toHaveLength(10);
  });

  it("excludes visually ambiguous characters (0, O, 1, I, l)", () => {
    // Generate a large sample — this is probabilistic, not exhaustive, but
    // 2000 draws makes a false pass astronomically unlikely if the
    // alphabet were ever accidentally widened.
    const slugs = Array.from({ length: 2000 }, () => generateExperienceSlug());
    const combined = slugs.join("");
    expect(combined).not.toMatch(/[0O1Il]/);
  });

  it("produces distinct values across repeated calls", () => {
    const slugs = new Set(Array.from({ length: 500 }, () => generateExperienceSlug()));
    expect(slugs.size).toBe(500);
  });
});

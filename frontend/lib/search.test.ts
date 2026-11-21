import { describe, it, expect } from "vitest";
import { matchesQuery, rankMatch } from "./search";

describe("matchesQuery", () => {
  it("matches a simple prefix", () => {
    expect(matchesQuery("Milk 2L", "mil")).toBe(true);
  });

  it("requires every query word to prefix-match some name word", () => {
    expect(matchesQuery("Anchor Blue Top Milk", "milk blue")).toBe(true);
    expect(matchesQuery("Anchor Blue Top Milk", "milk cheese")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(matchesQuery("Wholemeal Bread", "WHOLE")).toBe(true);
  });

  it("returns false for an empty query", () => {
    expect(matchesQuery("Bread", "")).toBe(false);
  });
});

describe("rankMatch", () => {
  it("ranks an exact match first", () => {
    expect(rankMatch("Milk", "milk")).toBe(0);
  });

  it("ranks a prefix match above a later-word match", () => {
    const prefix = rankMatch("Milk 2L", "milk");
    const laterWord = rankMatch("Anchor Blue Milk", "milk");
    expect(prefix).toBeLessThan(laterWord);
  });

  it("ranks a non-match as 1000", () => {
    expect(rankMatch("Bread", "milk")).toBe(1000);
  });
});

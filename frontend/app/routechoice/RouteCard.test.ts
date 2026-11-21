import { describe, it, expect } from "vitest";
import { formatDuration, totalCost } from "./RouteCard";
import type { RouteResult } from "./types";

describe("formatDuration", () => {
  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(300)).toBe("5 min");
  });

  it("formats exact hours without minutes", () => {
    expect(formatDuration(3600)).toBe("1h");
  });

  it("formats hours with remaining minutes", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
  });
});

describe("totalCost", () => {
  type Stops = NonNullable<RouteResult["data"]>["stops"];

  it("sums item price * qty across stops", () => {
    const stops = [
      { name: "A", address: "", lat: 0, lng: 0, items: [{ name: "Milk", price: "$3.50", image_url: "", qty: 2 }] },
      { name: "B", address: "", lat: 0, lng: 0, items: [{ name: "Bread", price: "$4.00", image_url: "", qty: 1 }] },
    ] as unknown as Stops;

    expect(totalCost(stops)).toBe("$11.00");
  });

  it("returns $0.00 for no items", () => {
    expect(totalCost([] as unknown as Stops)).toBe("$0.00");
  });
});

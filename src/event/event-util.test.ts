import { describe, expect, it } from "vitest";
import { getSuitableDates, getVotesPerDate } from "./event-util.ts";
import type { Vote } from "../database/types.ts";

const createVote = (
  id: number,
  date: Date,
  person: string,
  event_id: number,
): Vote => ({
  id,
  date,
  person,
  event_id,
});

describe("getVotesPerDate", () => {
  it("returns an empty array when there are no votes", () => {
    expect(getVotesPerDate([])).toEqual([]);
  });

  it("returns a single entry for a single vote", () => {
    const date = new Date(2024, 0, 15);
    const votes = [createVote(1, date, "Alice", 1)];

    expect(getVotesPerDate(votes)).toEqual([
      { date: "2024-01-15", people: ["Alice"] },
    ]);
  });

  it("aggregates multiple voters on the same date", () => {
    const date = new Date(2024, 2, 20);
    const votes = [
      createVote(1, date, "Alice", 1),
      createVote(2, date, "Bob", 1),
      createVote(3, date, "Charlie", 1),
    ];

    expect(getVotesPerDate(votes)).toEqual([
      { date: "2024-03-20", people: ["Alice", "Bob", "Charlie"] },
    ]);
  });

  it("separates votes on different dates", () => {
    const date1 = new Date(2024, 0, 10);
    const date2 = new Date(2024, 0, 11);
    const votes = [
      createVote(1, date1, "Alice", 1),
      createVote(2, date2, "Bob", 1),
    ];

    expect(getVotesPerDate(votes)).toEqual([
      { date: "2024-01-10", people: ["Alice"] },
      { date: "2024-01-11", people: ["Bob"] },
    ]);
  });

  it("handles multiple dates with multiple voters each", () => {
    const date1 = new Date(2024, 5, 1);
    const date2 = new Date(2024, 5, 2);
    const votes = [
      createVote(1, date1, "Alice", 1),
      createVote(2, date1, "Bob", 1),
      createVote(3, date2, "Charlie", 1),
      createVote(4, date2, "Alice", 1),
    ];

    expect(getVotesPerDate(votes)).toEqual([
      { date: "2024-06-01", people: ["Alice", "Bob"] },
      { date: "2024-06-02", people: ["Alice", "Charlie"] },
    ]);
  });

  it("does not include the same person multiple times if they voted for the same date twice", () => {
    const date = new Date(2024, 1, 14);
    const votes = [
      createVote(1, date, "Alice", 1),
      createVote(2, date, "Alice", 1),
    ];

    expect(getVotesPerDate(votes)).toEqual([
      { date: "2024-02-14", people: ["Alice"] },
    ]);
  });

  it("formats dates as YYYY-MM-DD strings", () => {
    const date = new Date(2024, 11, 25);
    const votes = [createVote(1, date, "Alice", 1)];

    const result = getVotesPerDate(votes);
    expect(result[0]?.date).toBe("2024-12-25");
  });
});

describe("getSuitableDates", () => {
  it("returns an empty array when there are no votes", () => {
    expect(getSuitableDates([])).toEqual([]);
  });

  it("returns the date when a single person voted for a single date", () => {
    const date = new Date(2024, 0, 15);
    const votes = [createVote(1, date, "Alice", 1)];

    expect(getSuitableDates(votes)).toEqual([
      { date: "2024-01-15", people: ["Alice"] },
    ]);
  });

  it("returns the date when all participants voted for it", () => {
    const date = new Date(2024, 0, 15);
    const votes = [
      createVote(1, date, "Alice", 1),
      createVote(2, date, "Bob", 1),
    ];

    expect(getSuitableDates(votes)).toEqual([
      { date: "2024-01-15", people: ["Alice", "Bob"] },
    ]);
  });

  it("returns multiple dates when all participants voted for all of them", () => {
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);
    const votes = [
      createVote(1, date1, "Alice", 1),
      createVote(2, date2, "Alice", 1),
      createVote(3, date1, "Bob", 1),
      createVote(4, date2, "Bob", 1),
    ];

    expect(getSuitableDates(votes)).toEqual([
      { date: "2024-01-15", people: ["Alice", "Bob"] },
      { date: "2024-01-16", people: ["Alice", "Bob"] },
    ]);
  });

  it("returns only dates common to all participants", () => {
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);
    const votes = [
      createVote(1, date1, "Alice", 1),
      createVote(2, date2, "Alice", 1),
      createVote(3, date1, "Bob", 1),
      // Bob did NOT vote for date2
    ];

    const result = getSuitableDates(votes);

    expect(result).toEqual([{ date: "2024-01-15", people: ["Alice", "Bob"] }]);
  });

  it("returns an empty array when participants have no common dates", () => {
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);
    const votes = [
      createVote(1, date1, "Alice", 1),
      createVote(2, date2, "Bob", 1),
    ];

    expect(getSuitableDates(votes)).toEqual([]);
  });

  it("includes all participants in the people list for suitable dates", () => {
    const date = new Date(2024, 0, 15);
    const votes = [
      createVote(1, date, "Alice", 1),
      createVote(2, date, "Bob", 1),
      createVote(3, date, "Charlie", 1),
    ];

    const result = getSuitableDates(votes);
    expect(result).toHaveLength(1);
    expect(result[0]?.people).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("formats dates as YYYY-MM-DD strings", () => {
    const date = new Date(2024, 11, 25);
    const votes = [createVote(1, date, "Alice", 1)];

    const result = getSuitableDates(votes);
    expect(result[0]?.date).toBe("2024-12-25");
  });
});

import type { Vote } from "../database/types.ts";

/**
 * Formats a Date to YYYY-MM-DD using the local timezone.
 * PostgreSQL date columns are parsed by the pg driver as Date objects at
 * midnight local time, so local timezone methods return the correct calendar date.
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Aggregates votes per date and returns them.
 */
export const getVotesPerDate = (votes: Vote[]) => {
  const votesAggregated = new Map<string, string[]>();

  for (const vote of votes) {
    const dateKey = formatDate(vote.date);
    const currentVotes = votesAggregated.get(dateKey) ?? [];
    votesAggregated.set(dateKey, [...currentVotes, vote.person]);
  }

  const results = [];
  for (const [date, people] of votesAggregated) {
    // Remove duplicate names and sort people alphabetically
    results.push({ date, people: [...new Set(people)].sort() });
  }

  return results;
};

/**
 * Returns a list of dates suitable for all participants, based
 * on which dates are voted by all participants.
 */
export const getSuitableDates = (votes: Vote[]) => {
  const datesPerPerson = new Map<string, string[]>();
  for (const vote of votes) {
    const { person, date } = vote;
    const dateStr = formatDate(date);
    const currentDates = datesPerPerson.get(person) ?? [];
    datesPerPerson.set(person, [...currentDates, dateStr]);
  }

  const suitableDates = new Set<string>();
  const entries = datesPerPerson.entries();
  let firstElement = true;
  while (true) {
    const entry = entries.next().value;

    // Break loop when no entries are left
    if (!entry) break;

    const dates = entry[1];

    // Initialize suitableDates with the dates of the first element.
    if (firstElement) {
      // Suitable dates will be found by removing dates that do not exist
      // in subsequent elements.
      for (const date of dates) {
        suitableDates.add(date);
      }

      firstElement = false;
    } else {
      // Clear dates, that do not exist in the next entry
      for (const date of suitableDates) {
        if (!dates.includes(date)) suitableDates.delete(date);
      }
    }
  }

  const results = [];
  for (const date of suitableDates) {
    results.push({
      date,
      people: Array.from(datesPerPerson.keys()),
    });
  }

  return results;
};

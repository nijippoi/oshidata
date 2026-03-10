import { Person, PersonName } from './types.ts';

export function resolvePersonNames(person: Person, date?: Date | Temporal.PlainDate): PersonName[] {
  date = date || Temporal.Now.plainDateISO();
  if (date instanceof Date) date = Temporal.PlainDate.from(date.toISOString());
  const targetDate: Temporal.PlainDate = date;
  return person.names.filter((name) => {
    if (!name.active_date_ranges) return true;
    return name.active_date_ranges.some((range) => {
      if (!range.start && !range.end) return true;
      if (
        range.start && range.end && Temporal.PlainDate.compare(targetDate, Temporal.PlainDate.from(range.start)) >= 0 &&
        Temporal.PlainDate.compare(targetDate, Temporal.PlainDate.from(range.end)) <= 0
      ) return true;
      if (range.start && Temporal.PlainDate.compare(targetDate, Temporal.PlainDate.from(range.start)) >= 0) return true;
      if (range.end && Temporal.PlainDate.compare(targetDate, Temporal.PlainDate.from(range.end)) <= 0) return true;
      return false;
    });
  });
}

export function resolvePersonName(person: Person, date?: Date | Temporal.PlainDate): PersonName | undefined {
  const names = resolvePersonNames(person, date);
  return names ? names[0] : undefined;
}

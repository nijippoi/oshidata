import type { Person, PersonName } from './types.ts';

export function resolvePersonNames(
  person: Person,
  date?: Date | Temporal.PlainDate,
): PersonName[] {
  date = date || Temporal.Now.plainDateISO();
  if (date instanceof Date) date = Temporal.PlainDate.from(date.toISOString());
  const targetDate: Temporal.PlainDate = date;
  return person.names.filter((name) => {
    if (!name.active_date_ranges) return true;
    return name.active_date_ranges.some((range) => {
      if (!range.start && !range.end) return true;
      if (
        range.start && range.end &&
        Temporal.PlainDate.compare(
            targetDate,
            Temporal.PlainDate.from(range.start),
          ) >= 0 &&
        Temporal.PlainDate.compare(
            targetDate,
            Temporal.PlainDate.from(range.end),
          ) <= 0
      ) return true;
      if (
        range.start &&
        Temporal.PlainDate.compare(
            targetDate,
            Temporal.PlainDate.from(range.start),
          ) >= 0
      ) return true;
      if (
        range.end &&
        Temporal.PlainDate.compare(
            targetDate,
            Temporal.PlainDate.from(range.end),
          ) <= 0
      ) return true;
      return false;
    });
  });
}

export function resolvePersonName(
  person: Person,
  date?: Date | Temporal.PlainDate,
): PersonName | undefined {
  const names = resolvePersonNames(person, date);
  return names ? names[0] : undefined;
}

export function renderPersonName(
  person: Person,
  date?: Date | Temporal.PlainDate,
): string | undefined {
  const names = resolvePersonNames(person, date);
  if (!names) return undefined;
  return names.map((name) => {
    if (name.family_name && name.given_name) {
      return name.family_name + ' ' + name.given_name;
    }
    if (name.family_name) return name.family_name;
    if (name.given_name) return name.given_name;
    return undefined;
  }).join(' / ');
}

export function locale() {
  return navigator.language;
}

export function renderDate(date: Date): string {
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function renderPlainDate(date: Temporal.PlainDate): string {
  return date.toLocaleString(locale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function renderAge(
  date: Temporal.PlainDate,
): string {
  return Temporal.Now.plainDateISO().since(date, {
    largestUnit: 'year',
    smallestUnit: 'month',
  }).toLocaleString(locale(), {
    year: 'numeric',
    yearsDisplay: 'always',
    month: 'long',
    monthsDisplay: 'always',
  } as Intl.DurationFormatOptions);
}

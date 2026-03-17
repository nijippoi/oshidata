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

export function renderMonthDayDuration(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
): string {
  return to.since(from, {
    largestUnit: 'year',
    smallestUnit: 'month',
  }).toLocaleString(locale(), {
    year: 'numeric',
    yearsDisplay: 'always',
    month: 'long',
    monthsDisplay: 'always',
  } as Intl.DurationFormatOptions);
}

export function renderDayDuration(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
): string {
  return to.since(from, {
    largestUnit: 'day',
    smallestUnit: 'day',
  }).toLocaleString(locale(), {
    day: 'numeric',
    daysDisplay: 'always',
  } as Intl.DurationFormatOptions);
}

export function renderAge(
  date: Temporal.PlainDate,
): string {
  return renderMonthDayDuration(date, Temporal.Now.plainDateISO());
}

export function nextMonthDay(date: Temporal.PlainDate): Temporal.PlainDate {
  const now = Temporal.Now.plainDateISO();
  const dateNow = Temporal.PlainDate.from({
    year: now.year,
    month: date.month,
    day: date.day,
  });
  if (
    now.since(dateNow, { largestUnit: 'day', smallestUnit: 'day' }).days >= 0
  ) {
    return Temporal.PlainDate.from({
      year: now.year + 1,
      month: date.month,
      day: date.day,
    });
  }
  return dateNow;
}

export const ZODIACS: {
  [key: string]: {
    from: { month: number; day: number };
    to: { month: number; day: number };
  };
} = {
  aries: {
    from: {
      month: 3,
      day: 21,
    },
    to: {
      month: 4,
      day: 19,
    },
  },
  taurus: {
    from: {
      month: 4,
      day: 20,
    },
    to: {
      month: 5,
      day: 20,
    },
  },
  gemini: {
    from: {
      month: 5,
      day: 21,
    },
    to: {
      month: 6,
      day: 20,
    },
  },
  cancer: {
    from: {
      month: 6,
      day: 21,
    },
    to: {
      month: 7,
      day: 22,
    },
  },
  leo: {
    from: {
      month: 7,
      day: 23,
    },
    to: {
      month: 8,
      day: 22,
    },
  },
  virgo: {
    from: {
      month: 8,
      day: 23,
    },
    to: {
      month: 9,
      day: 22,
    },
  },
  libra: {
    from: {
      month: 9,
      day: 23,
    },
    to: {
      month: 10,
      day: 22,
    },
  },
  scorpio: {
    from: {
      month: 10,
      day: 23,
    },
    to: {
      month: 11,
      day: 21,
    },
  },
  sagittarius: {
    from: {
      month: 11,
      day: 22,
    },
    to: {
      month: 12,
      day: 21,
    },
  },
  capricorn: {
    from: {
      month: 12,
      day: 22,
    },
    to: {
      month: 1,
      day: 19,
    },
  },
  aquarius: {
    from: {
      month: 1,
      day: 20,
    },
    to: {
      month: 2,
      day: 18,
    },
  },
  pisces: {
    from: {
      month: 2,
      day: 19,
    },
    to: {
      month: 3,
      day: 20,
    },
  },
};

export function zodiac(date: Temporal.PlainDate): string | undefined {
  const month = date.month;
  const day = date.day;
  for (const key in ZODIACS) {
    const zodiac = ZODIACS[key];
    if (
      zodiac.from.month <= month &&
      zodiac.from.day <= day &&
      zodiac.to.month >= month &&
      zodiac.to.day >= day
    ) {
      return key;
    }
  }
  if (
    (ZODIACS.capricorn.from.month == month &&
      ZODIACS.capricorn.from.day <= day) ||
    (ZODIACS.capricorn.to.month == month &&
      ZODIACS.capricorn.to.day >= day)
  ) {
    return 'capricorn';
  }
  return undefined;
}

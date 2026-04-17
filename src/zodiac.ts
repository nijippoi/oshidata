export const ZODIACS: {
  [key: string]: {
    from: { month: number; day: number };
    to: { month: number; day: number };
  };
} = {
  aries: { from: { month: 3, day: 21 }, to: { month: 4, day: 19 } },
  taurus: { from: { month: 4, day: 20 }, to: { month: 5, day: 20 } },
  gemini: { from: { month: 5, day: 21 }, to: { month: 6, day: 20 } },
  cancer: { from: { month: 6, day: 21 }, to: { month: 7, day: 22 } },
  leo: { from: { month: 7, day: 23 }, to: { month: 8, day: 22 } },
  virgo: { from: { month: 8, day: 23 }, to: { month: 9, day: 22 } },
  libra: { from: { month: 9, day: 23 }, to: { month: 10, day: 22 } },
  scorpio: { from: { month: 10, day: 23 }, to: { month: 11, day: 21 } },
  sagittarius: { from: { month: 11, day: 22 }, to: { month: 12, day: 21 } },
  capricorn: { from: { month: 12, day: 22 }, to: { month: 1, day: 19 } },
  aquarius: { from: { month: 1, day: 20 }, to: { month: 2, day: 18 } },
  pisces: { from: { month: 2, day: 19 }, to: { month: 3, day: 20 } },
};

export function zodiac(date: Temporal.PlainDate): string | undefined {
  const month = date.month;
  const day = date.day;
  for (const key in ZODIACS) {
    const zodiac = ZODIACS[key];
    if (
      (zodiac.from.month == month &&
        zodiac.from.day <= day) ||
      (zodiac.to.month == month &&
        zodiac.to.day >= day)
    ) {
      return key;
    }
  }
  return undefined;
}

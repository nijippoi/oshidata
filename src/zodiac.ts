/**
 * 黄道十二星座のキー
 */
export type ZodiacKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

/**
 * 黄道十二星座のデータ型
 */
export interface ZodiacData {
  /** 開始月日(含む) */
  from: { month: number; day: number };
  /** 終了月日(含む) */
  to: { month: number; day: number };
}

/**
 * 黄道十二星座のデータ
 */
export const ZODIACS: Readonly<Record<ZodiacKey, ZodiacData>> = Object.freeze({
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
});

const GREGORYLIKE_CALENDARS = new Set(['gregory', 'iso8601', 'japanese', 'buddhist', 'roc']);

/**
 * 黄道十二星座を取得する
 * @param date - 日付
 * @returns 星座のキー
 */
export function zodiac(date: Temporal.PlainDate): ZodiacKey | undefined {
  if (!GREGORYLIKE_CALENDARS.has(date.calendarId)) {
    console.warn(`zodiac: date is not in a Gregorian-like calendar: ${date.calendarId}`);
    return undefined;
  }
  const month = date.month;
  const day = date.day;
  for (const key in ZODIACS) {
    const zodiac = ZODIACS[key as ZodiacKey];
    if (
      (zodiac.from.month == month &&
        zodiac.from.day <= day) ||
      (zodiac.to.month == month &&
        zodiac.to.day >= day)
    ) {
      return key as ZodiacKey;
    }
  }
  return undefined;
}

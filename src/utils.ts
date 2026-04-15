import { baseUrl } from './env.ts';
import type {
  DateRange,
  Group,
  GroupName,
  Groups,
  HasActiveDateRanges,
  Id,
  Paged,
  Person,
  PersonName,
  Persons,
  Predicate,
  Query,
} from './types.ts';

export const NAMESPACE = 'oshidata';
export const ENV_FILE = 'env.json';
export const GROUPS_FILE = 'groups.json';
export const PERSONS_FILE = 'persons.json';
export const DATA_PATH = '/data';
export const LABELS_PATH = '/labels';

export const PT1D = Temporal.Duration.from({ days: 1 });
export const PT1M = Temporal.Duration.from({ months: 1 });
export const PT1Y = Temporal.Duration.from({ years: 1 });

export function ns(value: string): string {
  return value ? `${NAMESPACE}--${value}` : NAMESPACE;
}

export const STORAGE_KEY_LOCALE = ns('locale');

export const LANGS = ['ja', 'en'];
export const LOCALES = ['ja-JP', 'en-US', 'en-UK'];

export function locale() {
  const local = localStorage.getItem(STORAGE_KEY_LOCALE);
  if (local) {
    if (LOCALES.indexOf(local) >= 0) {
      return local;
    } else {
      localStorage.removeItem(STORAGE_KEY_LOCALE);
    }
  }
  if (LOCALES.indexOf(navigator.language) >= 0) {
    return navigator.language;
  }
  return LOCALES[0];
}

export function lang() {
  return locale().split('-')[0];
}

export function init() {
  document.getElementsByTagName('html')[0].setAttribute('lang', lang());
}

export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function find(selectors: string, from?: Element): Element | null {
  return (from || document).querySelector(selectors);
}

// deno-lint-ignore no-explicit-any
export function findAll(selectors: string, from?: Element): NodeListOf<any> {
  return (from || document).querySelectorAll(selectors);
}

export function recordToMap<K extends string | number | symbol, V>(record: Record<K, V>): Map<K, V> {
  const m = new Map();
  Object.entries(record).forEach(([k, v]) => {
    if (v !== undefined) m.set(k, v);
  });
  return m;
}

export interface ElemBuilderInit {
  options?: ElementCreationOptions;
  classes?: Set<string> | string[];
  dataset?: Map<string, string | undefined> | Record<string, string | undefined>;
  attributes?: Map<string, string | undefined> | Record<string, string | undefined>;
  listeners?: Map<string, EventListener> | Record<string, EventListener>;
  children?: (ElemBuilder | Node | string)[];
}

export class ElemBuilder {
  private tag: string;
  private opts?: ElementCreationOptions;
  private classes: Set<string>;
  private children: (ElemBuilder | Node | string)[];
  private dataset: Map<string, string>;
  private attrs: Map<string, string>;
  private listeners: Map<string, EventListener>;

  constructor(tag: string, init?: ElemBuilderInit) {
    this.tag = tag;
    this.opts = init?.options;
    this.classes = init?.classes ? (Array.isArray(init?.classes) ? new Set(init?.classes) : init?.classes) : new Set();
    this.dataset = init?.dataset
      ? (init?.dataset instanceof Map ? init?.dataset : recordToMap(init?.dataset))
      : new Map();
    this.attrs = init?.attributes
      ? (init?.attributes instanceof Map ? init?.attributes : recordToMap(init?.attributes))
      : new Map();
    this.listeners = init?.listeners
      ? (init?.listeners instanceof Map ? init?.listeners : recordToMap(init?.listeners))
      : new Map();
    this.children = init?.children || [];
  }

  cls(...values: string[]): this {
    values.forEach((value) => this.classes.add(value));
    return this;
  }

  txt(value: string): this {
    this.children.push(value);
    return this;
  }

  evt(name: string, listener: EventListener): this {
    this.listeners.set(name, listener);
    return this;
  }

  add(...values: (ElemBuilder | Node | string)[]): this {
    this.children.push(...values);
    return this;
  }

  data(key: string, value?: string) {
    if (value === undefined || value === null) {
      this.dataset.delete(key);
    } else {
      this.dataset.set(key, value);
    }
    return this;
  }

  attr(key: string, value?: string) {
    if (value === undefined || value === null) {
      this.attrs.delete(key);
    } else {
      this.attrs.set(key, value);
    }
    return this;
  }

  elem(): HTMLElement {
    const el = document.createElement(this.tag, this.opts);
    el.classList.add(...this.classes);
    this.dataset.entries().forEach(([key, value]) => el.setAttribute(`data-${key}`, value));
    this.attrs.entries().forEach(([key, value]) => el.setAttribute(key, value));
    this.children.forEach((child) => {
      child instanceof ElemBuilder ? el.append(child.elem()) : el.append(child);
    });
    this.listeners.entries().forEach(([key, value]) => el.addEventListener(key, value));
    return el;
  }

  attach(value: ElemBuilder | Node): HTMLElement {
    const el = this.elem();
    value instanceof ElemBuilder ? value.add(this) : value.appendChild(el);
    return el;
  }
}

export function elb(tag: string, init?: ElemBuilderInit): ElemBuilder {
  return new ElemBuilder(tag, init);
}

export function el(tag: string, init?: ElemBuilderInit): HTMLElement {
  return new ElemBuilder(tag, init).elem();
}

export function clear<T extends Element | ShadowRoot | null | undefined>(
  elem: T,
): T {
  if (!elem) return elem;
  let child = elem.lastElementChild;
  while (child) {
    elem.removeChild(child);
    child = elem.lastElementChild;
  }
  elem.textContent = null;
  return elem;
}

// deno-lint-ignore no-explicit-any
export function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}

export function toPlainDate(date: Date): Temporal.PlainDate {
  return date.toTemporalInstant().toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate();
}

export function toDate(date: Temporal.PlainDate): Date {
  return new Date(date.toString());
}

export function isDateInRange(
  date: Temporal.PlainDate,
  start?: Temporal.PlainDate,
  end?: Temporal.PlainDate,
  options?: {
    startExclusive?: boolean; // default: false
    endExclusive?: boolean; // default: false
  },
): boolean {
  if (start && end) {
    return Temporal.PlainDate.compare(date, start) >= 0 &&
      Temporal.PlainDate.compare(date, end) <= 0;
  } else if (start) {
    return Temporal.PlainDate.compare(date, start) >= 0;
  } else if (end) {
    return Temporal.PlainDate.compare(date, end) >= 0;
  }
  return false;
}

export function resolveActiveDateRange(
  values: HasActiveDateRanges[],
  date?: Date | Temporal.PlainDate,
): HasActiveDateRanges[] {
  if (!date) {
    date = Temporal.Now.plainDateISO();
  } else if (date instanceof Date) {
    date = toPlainDate(date);
  }
  return values.filter((value) => {
    if (!value.active_date_ranges) return true;
    return value.active_date_ranges.some((range) => {
      if (!range.start && !range.end) return true;
      else {
        return isDateInRange(
          date,
          range.start ? Temporal.PlainDate.from(range.start) : undefined,
          range.end ? Temporal.PlainDate.from(range.end) : undefined,
        );
      }
    });
  });
}

export function renderDateRange(
  value: DateRange,
  baseDate: Temporal.PlainDate = Temporal.Now.plainDateISO(),
  showDuration: boolean = false,
): string {
  const start = value.start ? Temporal.PlainDate.from(value.start) : undefined;
  const end = value.end ? Temporal.PlainDate.from(value.end) : undefined;
  const range = formatRange(start, end);
  if (showDuration) {
    if (start && end) {
      const duration = formatDayDuration(start, end, false);
      return `${range} (${duration})`;
    } else if (value.start || value.end) {
      const duration = formatDayDuration(
        start || baseDate,
        end || baseDate,
        false,
      );
      return `${range} (${duration})`;
    }
  }
  return range;
}

export function formatGroupName(name: GroupName): string {
  return name.name;
}

export function renderGroupName(
  group: Group,
  date?: Date | Temporal.PlainDate,
): string {
  const names = resolveActiveDateRange(group.names, date) as GroupName[];
  if (names.length > 0) {
    return names.map(formatGroupName).join(' / ');
  } else {
    return group.names.map(formatGroupName).join(' / ');
  }
}

export function formatPersonName(name: PersonName): string {
  const parts = [];
  if (name.family_name) parts.push(name.family_name);
  if (name.given_name) parts.push(name.given_name);
  return parts.join(' ');
}

export function renderPersonName(
  person: Person,
  date?: Date | Temporal.PlainDate,
): string {
  const names = resolveActiveDateRange(person.names, date) as PersonName[];
  if (names.length > 0) {
    return names.map(formatPersonName).join(' / ');
  } else {
    return person.names.map(formatPersonName).join(' / ');
  }
}

const dateFormats: Map<string, Intl.DateTimeFormat> = new Map(
  [
    [
      'ja',
      new Intl.DateTimeFormat('ja', {
        dateStyle: 'long',
      }),
    ],
    [
      'ja-JP',
      new Intl.DateTimeFormat('ja-JP', {
        dateStyle: 'long',
      }),
    ],
  ],
);

export function dateFormat(localeKey: string = locale()) {
  return dateFormats.getOrInsertComputed(
    localeKey,
    (key) =>
      new Intl.DateTimeFormat(key, {
        dateStyle: 'long',
      }),
  );
}

export function formatDate(date: Date | Temporal.PlainDate): string {
  // Temporal型はIntl.DateTimeFormatに未対応（対応が不完全）なのでDateに一旦変換する
  return dateFormat().format(
    date instanceof Temporal.PlainDate ? toDate(date) : date,
  );
}

export function formatRange(
  start?: Date | Temporal.PlainDate,
  end?: Date | Temporal.PlainDate,
): string {
  if (start && end) {
    // formatRangeが返す形式がformatの形式と違う
    // return dateFormat(locale()).formatRange(
    //   start instanceof Temporal.PlainDate ? toDate(start) : start,
    //   end instanceof Temporal.PlainDate ? toDate(end) : end,
    // );
    return formatDate(start) + '〜' + formatDate(end);
  } else if (start) {
    return formatDate(start) + '〜';
  } else if (end) {
    return '〜' + formatDate(end);
  }
  return '';
}

const yearMonthDurationFormats: Map<string, Intl.DurationFormat> = new Map();

export function yearMonthDurationFormat(localeKey: string = locale()) {
  return yearMonthDurationFormats.getOrInsertComputed(
    localeKey,
    (key) =>
      new Intl.DurationFormat(key, {
        year: 'numeric',
        yearsDisplay: 'always',
        month: 'long',
        monthsDisplay: 'always',
      } as Intl.DurationFormatOptions),
  );
}

const dayDurationFormats: Map<string, Intl.DurationFormat> = new Map();

export function dayDurationFormat(localeKey: string = locale()) {
  return dayDurationFormats.getOrInsertComputed(
    localeKey,
    (key) =>
      new Intl.DurationFormat(key, {
        day: 'numeric',
        daysDisplay: 'always',
      } as Intl.DurationFormatOptions),
  );
}

export function formatYearMonthDuration(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
): string {
  return yearMonthDurationFormat().format(to.since(from, {
    largestUnit: 'year',
    smallestUnit: 'month',
  }));
}

export function formatDayDuration(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
  inclusive: boolean = false,
): string {
  const dur = to.since(from, {
    largestUnit: 'day',
    smallestUnit: 'day',
  });
  return inclusive ? dayDurationFormat().format(dur.add(PT1D)) : dayDurationFormat().format(dur);
}

export function formatAge(
  date: Temporal.PlainDate,
  baseDate: Temporal.PlainDate = Temporal.Now.plainDateISO(),
): string {
  return formatYearMonthDuration(date, baseDate);
}

export function countryFlagEmoji(code: string): string {
  const codePoints = code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function renderLocation(person: Person): string {
  if (!person.hometown) return '';
  let value = '';
  if (person.hometown.country) {
    value += countryFlagEmoji(person.hometown.country);
  }
  if (person.hometown.state) {
    value += ` ${person.hometown.state}`;
  }
  if (person.hometown.city) {
    value += ` ${person.hometown.city}`;
  }
  return value;
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

export function getAttrs(
  elem: Element,
  key: string,
  defaultValues: string[] = [],
): string[] {
  return elem.getAttribute(key)?.split(',') || defaultValues;
}

export function setAttrs(
  elem: Element,
  key: string,
  values: string[],
  defaultValues: string[] = [],
) {
  elem.setAttribute(
    key,
    (values.length > 0 ? values : defaultValues).join(','),
  );
}

export async function fetchGroups(): Promise<Groups> {
  return await fetch(`${baseUrl}${DATA_PATH}/${GROUPS_FILE}`).then((res) => res.json());
}

export async function fetchPersons(): Promise<Persons> {
  return await fetch(`${baseUrl}${DATA_PATH}/${PERSONS_FILE}`).then((res) => res.json());
}

export function isPersonInGroup(
  groupIds: Id[],
  date: Temporal.PlainDate,
): Predicate<Person> {
  return (person: Person): boolean => {
    return person.roles?.some((role) => {
      return role.active_date_ranges?.some((role_date) => {
        if (role_date.start && role_date.end) {
          return Temporal.PlainDate.compare(
                date,
                Temporal.PlainDate.from(role_date.start),
              ) >= 0 &&
            Temporal.PlainDate.compare(
                date,
                Temporal.PlainDate.from(role_date.end),
              ) <= 0;
        } else if (role_date.start) {
          return Temporal.PlainDate.compare(
            date,
            Temporal.PlainDate.from(role_date.start),
          ) >= 0;
        } else if (role_date.end) {
          return Temporal.PlainDate.compare(
            date,
            Temporal.PlainDate.from(role_date.end),
          ) <= 0;
        }
        return true;
      }) || false;
    }) || false;
  };
}

export async function queryGroups(query?: Query<Group>): Promise<Paged<Group>> {
  return await fetchGroups().then((groups) => {
    const records = [];
    let nextPage = undefined;
    for (const key in groups) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(groups[key]))) {
          records.push(groups[key]);
        }
      } else {
        records.push(groups[key]);
      }
    }
    if (query && query.orders && query.orders.length > 0) {
      // TODO
    }
    return {
      records,
      'next_page': nextPage,
    };
  });
}

export async function queryPersons(
  query?: Query<Person>,
): Promise<Paged<Person>> {
  return await fetchPersons().then((persons) => {
    const records = [];
    let nextPage = undefined;
    for (const key in persons) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(persons[key]))) {
          records.push(persons[key]);
        }
      } else {
        records.push(persons[key]);
      }
    }
    if (query && query.orders && query.orders.length > 0) {
      // TODO
    }
    return {
      records,
      'next_page': nextPage,
    };
  });
}

export class Option<T> {
  // deno-lint-ignore no-explicit-any
  private static EMPTY = new Option<any>(undefined);

  static empty<T>(): Option<T> {
    return Option.EMPTY;
  }

  static from<T>(value: T | undefined | null): Option<T> {
    return (value === undefined || value === null) ? Option.EMPTY : new Option<T>(value);
  }

  private value: T | undefined;

  private constructor(value: T | undefined | null) {
    this.value = (value === undefined || value === null) ? undefined : value;
  }

  isPresent(): boolean {
    return this.value !== undefined;
  }

  isEmpty(): boolean {
    return this.value === undefined;
  }

  /**
   * @returns {T} value
   * @throws {Error}
   */
  get(): T {
    if (this.value === undefined) throw new Error('value is not present');
    return this.value;
  }

  getOr(value: T): T {
    return this.value === undefined ? value : this.value;
  }

  getOrElse(supplier: () => T): T {
    return this.value === undefined ? supplier() : this.value;
  }

  map<T2>(mapper: (value: T) => T2): Option<T2> {
    if (this.value === undefined) return Option.EMPTY;
    else return new Option<T2>(mapper(this.value));
  }

  mapOr<T2>(mapper: (value: T) => T2, value: T2): Option<T2> {
    if (this.value === undefined) return new Option<T2>(value);
    else return new Option<T2>(mapper(this.value));
  }

  mapOrElse<T2>(mapper: (value: T) => T2, supplier: () => T2): Option<T2> {
    if (this.value === undefined) return new Option<T2>(supplier());
    else return new Option<T2>(mapper(this.value));
  }
}

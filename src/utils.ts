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

export const LANGS = ['ja', 'en'];

export function locale() {
  return navigator.language;
}

export function lang() {
  return locale().split('-')[0];
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

export class ElemBuilder {
  private tag: string;
  private opts?: ElementCreationOptions;
  private classes: Set<string>;
  private children: (ElemBuilder | Node | string)[];
  private dataset: Map<string, string>;
  private attrs: Map<string, string>;
  private listeners: Map<string, EventListener>;

  constructor(tag: string, options?: ElementCreationOptions) {
    this.tag = tag;
    this.opts = options;
    this.classes = new Set();
    this.dataset = new Map();
    this.attrs = new Map();
    this.listeners = new Map();
    this.children = [];
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
    this.dataset.entries().forEach(([key, value]) =>
      el.setAttribute(`data-${key}`, value)
    );
    this.attrs.entries().forEach(([key, value]) => el.setAttribute(key, value));
    this.children.forEach((child) => {
      child instanceof ElemBuilder ? el.append(child.elem()) : el.append(child);
    });
    this.listeners.entries().forEach(([key, value]) =>
      el.addEventListener(key, value)
    );
    return el;
  }

  attach(value: ElemBuilder | Node): HTMLElement {
    const el = this.elem();
    value instanceof ElemBuilder ? value.add(this) : value.appendChild(el);
    return el;
  }
}

export function elb(
  tag: string,
  options?: ElementCreationOptions,
): ElemBuilder {
  return new ElemBuilder(tag, options);
}

export function el(
  tagName: string,
  classList?: string[] | null,
  innerHTML?: string | null,
  dataset?: DOMStringMap | null,
  options?: ElementCreationOptions,
): HTMLElement {
  const e = document.createElement(tagName, options);
  if (classList) e.classList.add(...classList);
  if (innerHTML) e.innerHTML = innerHTML;
  if (dataset) {
    for (const key in dataset) {
      e.dataset[key] = dataset[key];
    }
  }
  return e;
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

export function dateToPlainDate(date: Date): Temporal.PlainDate {
  return date.toTemporalInstant().toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate();
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
    date = dateToPlainDate(date);
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
  const start = value.start
    ? renderPlainDate(Temporal.PlainDate.from(value.start))
    : '';
  const end = value.end
    ? renderPlainDate(Temporal.PlainDate.from(value.end))
    : '';
  if (showDuration) {
    if (value.start && value.end) {
      const duration = renderDayDuration(
        Temporal.PlainDate.from(value.start),
        Temporal.PlainDate.from(value.end),
        false,
      );
      return `${start}〜${end} (${duration})`;
    } else if (value.start || value.end) {
      const duration = renderDayDuration(
        value.start ? Temporal.PlainDate.from(value.start) : baseDate,
        value.end ? Temporal.PlainDate.from(value.end) : baseDate,
        false,
      );
      return `${start}〜${end} (${duration})`;
    }
  }
  return `${start}〜${end}`;
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

export function renderDate(date: Date): string {
  return date.toLocaleString(locale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function renderPlainDate(date: Temporal.PlainDate): string {
  // return date.toLocaleString(locale(), {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  // });
  // Temporal型はIntl.DateTimeFormatに未対応（対応が不完全）なのでDateに一旦変換する
  return renderDate(new Date(date.toString()));
}

export function renderDuration(
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
  inclusive: boolean = false,
): string {
  if (inclusive) {
    return to
      .since(from, {
        largestUnit: 'day',
        smallestUnit: 'day',
      })
      .add(PT1D)
      .toLocaleString(locale(), {
        day: 'numeric',
        daysDisplay: 'always',
      } as Intl.DurationFormatOptions);
  }
  return to
    .since(from, {
      largestUnit: 'day',
      smallestUnit: 'day',
    })
    .toLocaleString(locale(), {
      day: 'numeric',
      daysDisplay: 'always',
    } as Intl.DurationFormatOptions);
}

export function renderAge(
  date: Temporal.PlainDate,
): string {
  return renderDuration(date, Temporal.Now.plainDateISO());
}

export function countryFlagEmoji(code: string): string {
  const codePoints = code.toUpperCase().split('').map((c) =>
    127397 + c.charCodeAt(0)
  );
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
  return await fetch(`${baseUrl}${DATA_PATH}/${GROUPS_FILE}`).then((res) =>
    res.json()
  );
}

export async function fetchPersons(): Promise<Persons> {
  return await fetch(`${baseUrl}${DATA_PATH}/${PERSONS_FILE}`).then((res) =>
    res.json()
  );
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
    return (value === undefined || value === null)
      ? Option.EMPTY
      : new Option<T>(value);
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

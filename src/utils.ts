import { baseUrl } from './env.ts';
import type { Group, GroupName, HasPeriods, Period, Person, PersonName } from './types.ts';

export const NAMESPACE = 'oshidata';

export const GROUPS_FILE = 'groups.json';
export const PERSONS_FILE = 'persons.json';
export const TAGS_FILE = 'tags.json';

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

  clear(): this {
    this.children = [];
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

  el(): HTMLElement {
    const elem = document.createElement(this.tag, this.opts);
    elem.classList.add(...this.classes);
    this.dataset.entries().forEach(([key, value]) => elem.setAttribute(`data-${key}`, value));
    this.attrs.entries().forEach(([key, value]) => elem.setAttribute(key, value));
    this.children.forEach((child) => {
      child instanceof ElemBuilder ? elem.append(child.el()) : elem.append(child);
    });
    this.listeners.entries().forEach(([key, value]) => elem.addEventListener(key, value));
    return elem;
  }

  attach(value: ElemBuilder | Node): HTMLElement {
    const elem = this.el();
    value instanceof ElemBuilder ? value.add(this) : value.appendChild(elem);
    return elem;
  }

  root(tag: string, init?: ElemBuilderInit): ElemBuilder {
    return new ElemBuilder(tag, init).add(this.el());
  }

  rootb(tag: string, init?: ElemBuilderInit): HTMLElement {
    return this.root(tag, init).el();
  }
}

export function elb(tag: string, init?: ElemBuilderInit): ElemBuilder {
  return new ElemBuilder(tag, init);
}

export function el(tag: string, init?: ElemBuilderInit & { attach?: ElemBuilder | Node }): HTMLElement {
  if (init?.attach) {
    return new ElemBuilder(tag, init).attach(init.attach);
  }
  return new ElemBuilder(tag, init).el();
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

export function getAttrs(
  elem: Element,
  key: string,
  defaultValues: string[] = [],
): string[] {
  return elem.getAttribute(key)?.split(',') || defaultValues;
}

export function getNonEmptyAttrs(
  elem: Element,
  key: string,
  defaultValues: string[] = [],
): string[] {
  return getAttrs(elem, key, defaultValues).filter((value) => value && value.trim().length > 0);
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

export function setNonEmptyAttrs(
  elem: Element,
  key: string,
  values: string[],
  defaultValues: string[] = [],
) {
  setAttrs(elem, key, values.filter((value) => value && value.trim().length > 0), defaultValues);
}

export function cssRules(...rules: string[]): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  rules.forEach((rule) => sheet.insertRule(rule));
  return sheet;
}

// deno-lint-ignore no-explicit-any
export function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}

export function currentPlainDate(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO();
}

export function parsePlainDate(date: Temporal.PlainDateLike): Temporal.PlainDate {
  return Temporal.PlainDate.from(date).withCalendar('iso8601');
}

export function toPlainDate(date: Date): Temporal.PlainDate {
  return date.toTemporalInstant().toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDate();
}

export function toDate(date: Temporal.PlainDate): Date {
  date = date.withCalendar('iso8601');
  return new Date(date.year, date.month - 1, date.day, 0, 0, 0, 0);
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

export function resolvePeriod(
  values: HasPeriods[],
  date?: Date | Temporal.PlainDate,
): HasPeriods[] {
  if (!date) {
    date = currentPlainDate();
  } else if (date instanceof Date) {
    date = toPlainDate(date);
  }
  return values.filter((value) => {
    if (!value.periods) return true;
    return value.periods.some((period) => {
      if (!period.start && !period.end) return true;
      else {
        return isDateInRange(
          date,
          period.start ? parsePlainDate(period.start) : undefined,
          period.end ? parsePlainDate(period.end) : undefined,
        );
      }
    });
  });
}

export function renderPeriod(
  value: Period,
  baseDate: Temporal.PlainDate = currentPlainDate(),
  showDuration: boolean = false,
): string {
  const start = value.start ? parsePlainDate(value.start) : undefined;
  const end = value.end ? parsePlainDate(value.end) : undefined;
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
  const names = resolvePeriod(group.names, date) as GroupName[];
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
  const names = resolvePeriod(person.names, date) as PersonName[];
  if (names.length > 0) {
    return names.map(formatPersonName).join(' / ');
  } else {
    return person.names.map(formatPersonName).join(' / ');
  }
}

const dateFormats: Map<string, Intl.DateTimeFormat> = new Map(
  [
    ['ja', new Intl.DateTimeFormat('ja', { dateStyle: 'long' })],
    ['ja-JP', new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' })],
  ],
);

export function dateFormat(localeKey: string = locale()) {
  return dateFormats.getOrInsertComputed(
    localeKey,
    (key) => new Intl.DateTimeFormat(key, { dateStyle: 'long' }),
  );
}

export function formatDate(date: Date | Temporal.PlainDate): string {
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
    // Issue: https://unicode-org.atlassian.net/browse/CLDR-14993
    // Issue: https://github.com/tc39/proposal-temporal/issues/3062
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
        years: 'long',
        yearsDisplay: 'always',
        months: 'long',
        monthsDisplay: 'always',
      }),
  );
}

const dayDurationFormats: Map<string, Intl.DurationFormat> = new Map();

export function dayDurationFormat(localeKey: string = locale()) {
  return dayDurationFormats.getOrInsertComputed(
    localeKey,
    (key) =>
      new Intl.DurationFormat(key, {
        days: 'long',
        daysDisplay: 'always',
      }),
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
  baseDate: Temporal.PlainDate = currentPlainDate(),
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
  const now = currentPlainDate();
  const dateNow = parsePlainDate({
    year: now.year,
    month: date.month,
    day: date.day,
  });
  if (
    now.since(dateNow, { largestUnit: 'day', smallestUnit: 'day' }).days >= 0
  ) {
    return parsePlainDate({
      year: now.year + 1,
      month: date.month,
      day: date.day,
    });
  }
  return dateNow;
}

export function personUrl(id: string): URL {
  const url = new URL(baseUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  pathParts.push('person');
  url.pathname = '/' + pathParts.join('/');
  url.searchParams.set('id', id);
  return url;
}

export function groupUrl(id: string): URL {
  const url = new URL(baseUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  pathParts.push('group');
  url.pathname = '/' + pathParts.join('/');
  url.searchParams.set('id', id);
  return url;
}

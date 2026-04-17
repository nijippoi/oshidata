export default class Option<T> {
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

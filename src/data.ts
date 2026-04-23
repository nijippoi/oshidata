import type { Group, Groups, Id, Paged, Person, Persons, Predicate, Query, Tags } from './types.ts';
import { baseUrl } from './env.ts';
import { DATA_PATH, GROUPS_FILE, parsePlainDate, PERSONS_FILE, TAGS_FILE } from './utils.ts';

class RawData {
  private static persons: Persons | undefined;
  private static groups: Groups | undefined;
  private static tags: Tags | undefined;

  constructor() {}

  static async getPersons(): Promise<Persons> {
    if (RawData.persons === undefined) {
      return await navigator.locks.request(DATA_PATH, { mode: 'shared' }, async () => {
        if (RawData.persons === undefined) {
          RawData.persons = await fetch(`${baseUrl}${DATA_PATH}/${PERSONS_FILE}`).then((res) => res.json()) as Persons;
        }
        return RawData.persons;
      });
    }
    return RawData.persons;
  }

  static async getGroups(): Promise<Groups> {
    if (RawData.groups === undefined) {
      return await navigator.locks.request(DATA_PATH, { mode: 'shared' }, async () => {
        if (RawData.groups === undefined) {
          RawData.groups = await fetch(`${baseUrl}${DATA_PATH}/${GROUPS_FILE}`).then((res) => res.json()) as Groups;
        }
        return RawData.groups;
      });
    }
    return RawData.groups;
  }

  static async getTags(): Promise<Tags> {
    if (RawData.tags === undefined) {
      return await navigator.locks.request(DATA_PATH, { mode: 'shared' }, async () => {
        if (RawData.tags === undefined) {
          RawData.tags = await fetch(`${baseUrl}${DATA_PATH}/${TAGS_FILE}`).then((res) => res.json()) as Tags;
        }
        return RawData.tags;
      });
    }
    return RawData.tags;
  }
}

export function isPersonInGroup(
  groupIds: Id[],
  date: Temporal.PlainDate,
): Predicate<Person> {
  return (person: Person): boolean => {
    return person.roles?.some((role) => {
      return role.periods?.some((role_date) => {
        if (role_date.start && role_date.end) {
          return Temporal.PlainDate.compare(
                date,
                parsePlainDate(role_date.start),
              ) >= 0 &&
            Temporal.PlainDate.compare(
                date,
                parsePlainDate(role_date.end),
              ) <= 0;
        } else if (role_date.start) {
          return Temporal.PlainDate.compare(
            date,
            parsePlainDate(role_date.start),
          ) >= 0;
        } else if (role_date.end) {
          return Temporal.PlainDate.compare(
            date,
            parsePlainDate(role_date.end),
          ) <= 0;
        }
        return true;
      }) || false;
    }) || false;
  };
}

export async function queryGroups(query?: Query<Group>): Promise<Paged<Group>> {
  return await RawData.getGroups().then((items) => {
    const records = [];
    let nextPage = undefined;
    for (const key in items) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(items[key]))) {
          records.push(items[key]);
        }
      } else {
        records.push(items[key]);
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
  return await RawData.getPersons().then((items) => {
    const records = [];
    let nextPage = undefined;
    for (const key in items) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(items[key]))) {
          records.push(items[key]);
        }
      } else {
        records.push(items[key]);
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

export async function queryGroupTags(query?: Query<string>): Promise<Paged<string>> {
  return await RawData.getTags().then((items) => {
    const records = [];
    let nextPage = undefined;
    for (const item in items.group) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(item))) {
          records.push(item);
        }
      } else {
        records.push(item);
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

export async function queryPersonTags(query?: Query<string>): Promise<Paged<string>> {
  return await RawData.getTags().then((items) => {
    const records = [];
    let nextPage = undefined;
    for (const item in items.person) {
      if (query && query.filters && query.filters.length > 0) {
        if (query.filters.every((filter) => filter(item))) {
          records.push(item);
        }
      } else {
        records.push(item);
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

export async function getPerson(id: Id): Promise<Person | undefined> {
  return await RawData.getPersons().then((items) => {
    return items[id];
  });
}

export async function getGroup(id: Id): Promise<Group | undefined> {
  return await RawData.getGroups().then((items) => {
    return items[id];
  });
}

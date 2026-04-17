import { baseUrl } from './env.ts';
import type { Group, Groups, Id, Paged, Person, Persons, Predicate, Query, Tags } from './types.ts';
import { DATA_PATH, GROUPS_FILE, PERSONS_FILE, TAGS_FILE } from './utils.ts';

export async function fetchGroups(): Promise<Groups> {
  return await fetch(`${baseUrl}${DATA_PATH}/${GROUPS_FILE}`).then((res) => res.json());
}

export async function fetchPersons(): Promise<Persons> {
  return await fetch(`${baseUrl}${DATA_PATH}/${PERSONS_FILE}`).then((res) => res.json());
}

export async function fetchTags(): Promise<Tags> {
  return await fetch(`${baseUrl}${DATA_PATH}/${TAGS_FILE}`).then((res) => res.json());
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
  return await fetchGroups().then((items) => {
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
  return await fetchPersons().then((items) => {
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
  return await fetchTags().then((items) => {
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
  return await fetchTags().then((items) => {
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

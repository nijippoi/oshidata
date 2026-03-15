import { Dexie } from 'dexie';

export const DB_NAME = 'oshidata';
export const DB_VERSION = 1;

export function open(): Dexie {
  const db = new Dexie(DB_NAME);
  return db;
}

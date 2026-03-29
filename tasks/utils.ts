import { expandGlob, expandGlobSync } from '@std/fs';
import { join, normalize } from '@std/path';

export const DEFAULT_RELEASE = true;
export const DEFAULT_SERVE_PORT = 3000;
export const DEFAULT_SERVE_HOSTNAME = '127.0.0.1';
export const DEFAULT_DIST_DIR = join(Deno.cwd(), 'dist');
export const DEFAULT_INPUT_DIR = join(Deno.cwd(), 'input');
export const DEFAULT_SRC_DIR = join(Deno.cwd(), 'src');
export const DEFAULT_SRC_DATA_DIR = join(DEFAULT_SRC_DIR, 'data');
export const DEFAULT_ENV_JSON = join(DEFAULT_SRC_DIR, 'env.json');
export const DEFAULT_WATCH_EXCLUDES = [
  join(DEFAULT_SRC_DATA_DIR, '**', '*'),
  DEFAULT_ENV_JSON,
];

export async function globFiles(glob: string, root: string): Promise<string[]> {
  return (await Array.fromAsync(
    expandGlob(glob, { root }),
  )).filter((entry) => entry.isFile).map((entry) => entry.path);
}

export function globFilesSync(glob: string, root: string): string[] {
  return Array.from(expandGlobSync(glob, { root })).filter((entry) =>
    entry.isFile
  ).map((entry) => entry.path);
}

export function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}

const matchGlobCache = new Map<string, string[]>();

export function matchesGlobSync(
  glob: string | string[],
  path: string | string[],
): boolean {
  if (!glob || !path) return false;
  if (isString(glob)) glob = [glob] as string[];
  if (isString(path)) path = [path] as string[];
  if (!Array.isArray(glob) || glob.length <= 0) return false;
  if (!Array.isArray(path) || path.length <= 0) return false;
  const normalizedPaths = path.map((p) => normalize(p));
  for (const p of normalizedPaths) {
    if (matchGlobCache.has(p)) {
      const curGlobs = matchGlobCache.get(p) || [];
      for (const g of glob) {
        if (curGlobs.indexOf(g) >= 0) {
          // console.log('cache hit', p, g);
          return true;
        }
      }
    }
  }
  for (const g of glob) {
    const iter = expandGlobSync(g);
    for (const entry of iter) {
      // console.log('comparing', normalizedPaths, entry.path);
      const idx = normalizedPaths.indexOf(entry.path);
      if (idx >= 0) {
        const curGlobs = matchGlobCache.get(normalizedPaths[idx]);
        if (curGlobs) {
          curGlobs.push(g);
          matchGlobCache.set(normalizedPaths[idx], curGlobs);
        } else {
          matchGlobCache.set(normalizedPaths[idx], [g]);
        }
        return true;
      }
    }
  }
  return false;
}

export function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

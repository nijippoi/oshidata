import { existsSync } from '@std/fs';
import {
  DEFAULT_DATA_DIR,
  DEFAULT_DIST_DIR,
  DEFAULT_LABELS_DIR,
} from './utils.ts';

export function clean(paths?: string[]) {
  paths = (paths && paths.length > 0)
    ? paths
    : [DEFAULT_DIST_DIR, DEFAULT_DATA_DIR, DEFAULT_LABELS_DIR];
  try {
    paths.forEach((path) => {
      console.info(`Removing '${path}'`);
      if (existsSync(path)) {
        Deno.removeSync(path, { recursive: true });
      }
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

if (import.meta.main) {
  clean(Deno.args);
}

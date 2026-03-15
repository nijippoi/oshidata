import { expandGlob, expandGlobSync } from '@std/fs';

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

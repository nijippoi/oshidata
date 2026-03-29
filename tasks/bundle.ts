import { parseArgs } from '@std/cli/parse-args';
import { basename, join, relative } from '@std/path';
import { globFilesSync, utcDate } from './utils.ts';
import { existsSync } from '@std/fs';

const DEFAULT_DIST_DIR = join(Deno.cwd(), 'dist');
const SRC_DIR = join(Deno.cwd(), 'src');

export async function bundle(
  release: boolean = true,
  distDir: string = DEFAULT_DIST_DIR,
  baseUrl?: string,
): Promise<void> {
  console.log(
    `Bundling release=${release} distDir=${distDir} baseUrl=${baseUrl}`,
  );
  if (baseUrl) {
    Deno.writeTextFileSync(
      join(SRC_DIR, 'env.json'),
      JSON.stringify({ baseUrl }, null, 2),
    );
  }
  try {
    // bundle
    const files = globFilesSync(
      '**/*.{html,ts,js,tsx,jsx}',
      SRC_DIR,
    );
    const result = await Deno.bundle({
      outputDir: distDir,
      minify: release,
      entrypoints: files,
      platform: 'browser',
      format: 'esm',
      // inlineImports: true,
      codeSplitting: false,
      keepNames: !release,
      sourcemap: 'linked',
      write: true,
    });
    if (!result.success) {
      console.error(result);
    }

    // copy data
    const distDataDir = join(distDir, 'data');
    if (!existsSync(distDataDir)) {
      Deno.mkdirSync(join(distDir, 'data'), { recursive: true });
    }
    globFilesSync('*.{json}', join(Deno.cwd(), 'src', 'data')).forEach(
      (file) =>
        Deno.copyFileSync(
          file,
          join(distDataDir, basename(file)),
        ),
    );

    // copy labels
    const distLabelsDir = join(distDir, 'labels');
    if (!existsSync(distLabelsDir)) {
      Deno.mkdirSync(distLabelsDir, { recursive: true });
    }
    globFilesSync('*.{json}', join(Deno.cwd(), 'src', 'labels')).forEach(
      (file) =>
        Deno.copyFileSync(
          file,
          join(distLabelsDir, basename(file)),
        ),
    );
  } catch (error) {
    console.error(error);
  }
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['distdir', 'baseurl'],
    boolean: ['release'],
    negatable: ['release'],
    default: { release: true, distdir: DEFAULT_DIST_DIR },
  });
  await bundle(args.release, args.distdir, args.baseurl);
}

import { parseArgs } from '@std/cli/parse-args';
import { basename, join } from '@std/path';
import { globFilesSync } from './utils.ts';
import { existsSync } from '@std/fs';

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['outdir'],
    boolean: ['release'],
    negatable: ['release'],
    default: { outdir: join(Deno.cwd(), 'dist'), release: true },
  });
  try {
    const files = globFilesSync(
      '**/*.{html,ts,js,tsx,jsx}',
      join(Deno.cwd(), 'src'),
    );
    const result = await Deno.bundle({
      outputDir: args.outdir,
      minify: args.release,
      entrypoints: files,
      platform: 'browser',
      format: 'esm',
      // inlineImports: true,
      codeSplitting: false,
      keepNames: true,
      sourcemap: 'linked',
      write: true,
    });
    if (!result.success) {
      console.error(result);
    }
    const distDataDir = join(args.outdir, 'data');
    if (!existsSync(distDataDir)) {
      Deno.mkdirSync(join(args.outdir, 'data'), { recursive: true });
    }
    globFilesSync('*.{json}', join(Deno.cwd(), 'src', 'data')).forEach(
      (file) =>
        Deno.copyFileSync(
          file,
          join(distDataDir, basename(file)),
        ),
    );
    const distLabelsDir = join(args.outdir, 'labels');
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

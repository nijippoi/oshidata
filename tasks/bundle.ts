import { parseArgs } from '@std/cli/parse-args';
import { basename, join } from '@std/path';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_BASE_URL,
  DEFAULT_DATA_DIR,
  DEFAULT_DIST_DIR,
  DEFAULT_LABELS_DIR,
  DEFAULT_SRC_DIR,
  ENV_FILE,
  globFilesSync,
} from './utils.ts';
import { existsSync } from '@std/fs';

export async function bundle(
  release: boolean = true,
  dataDir: string = DEFAULT_DATA_DIR,
  labelsDir: string = DEFAULT_LABELS_DIR,
  srcDir: string = DEFAULT_SRC_DIR,
  distDir: string = DEFAULT_DIST_DIR,
  basePath: string = DEFAULT_BASE_PATH,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<void> {
  console.log(
    `Bundling release=${release} distDir=${distDir} baseUrl=${basePath} baseUrl=${basePath}`,
  );

  // env.json
  Deno.writeTextFileSync(
    join(srcDir, ENV_FILE),
    `export const baseUrl = '${baseUrl}';\nexport const basePath = '${basePath}';\n`,
  );

  try {
    if (!existsSync(distDir)) {
      Deno.mkdirSync(distDir, { recursive: true });
    }

    // bundle
    const files = globFilesSync(
      '**/*.{html,ts,js,tsx,jsx}',
      srcDir,
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
    globFilesSync('*.{json}', dataDir).forEach(
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
    globFilesSync('*.{json}', labelsDir).forEach(
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
    string: [
      'datadir',
      'srcdir',
      'distdir',
      'basepath',
      'baseurl',
      'labelsdir',
    ],
    boolean: ['release'],
    negatable: ['release'],
    default: {
      release: true,
      datadir: DEFAULT_DATA_DIR,
      srcdir: DEFAULT_SRC_DIR,
      distdir: DEFAULT_DIST_DIR,
      labelsdir: DEFAULT_LABELS_DIR,
      basepath: DEFAULT_BASE_PATH,
      baseurl: DEFAULT_BASE_URL,
    },
  });
  await bundle(
    args.release,
    args.datadir,
    args.labelsdir,
    args.srcdir,
    args.distdir,
    args.basepath,
    args.baseurl,
  );
}

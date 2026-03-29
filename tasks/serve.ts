import { serveDir } from '@std/http/file-server';
import { route } from '@std/http/unstable-route';
import { parseArgs } from '@std/cli';
import {
  DEFAULT_DIST_DIR,
  DEFAULT_ENV_JSON,
  DEFAULT_INPUT_DIR,
  DEFAULT_RELEASE,
  DEFAULT_SERVE_HOSTNAME,
  DEFAULT_SERVE_PORT,
  DEFAULT_SRC_DATA_DIR,
  DEFAULT_SRC_DIR,
  DEFAULT_WATCH_EXCLUDES,
  matchesGlobSync,
} from './utils.ts';
import { clean } from './clean.ts';
import { importData } from './import.ts';
import { bundle } from './bundle.ts';
import { join } from '@std/path';
import { glob } from '@std/path';

export function serveHttp(
  hostname: string = DEFAULT_SERVE_HOSTNAME,
  port: number = DEFAULT_SERVE_PORT,
  rootDir: string = DEFAULT_DIST_DIR,
) {
  try {
    Deno.serve(
      {
        hostname: hostname,
        port: port,
        onListen: (addr) => {
          console.log(`Serving http://${addr.hostname}:${addr.port}`);
        },
      },
      route(
        [
          {
            pattern: new URLPattern({ pathname: '/*' }),
            handler: (req: Request) => serveDir(req, { fsRoot: rootDir }),
          },
        ],
        () => new Response('not found', { status: 404 }),
      ),
    );
  } catch (err) {
    console.error('serve error', err);
  }
}

export async function watch(
  release: boolean = true,
  inputDir: string = DEFAULT_INPUT_DIR,
  srcDir: string = DEFAULT_SRC_DIR,
  srcDataDir: string = DEFAULT_SRC_DATA_DIR,
  distDir: string = DEFAULT_DIST_DIR,
  excludes: string[] = DEFAULT_WATCH_EXCLUDES,
  baseUrl: string = `http://${DEFAULT_SERVE_HOSTNAME}:${DEFAULT_SERVE_PORT}`,
): Promise<Deno.FsWatcher> {
  try {
    console.log(
      `Watching srcDir=${srcDir} srcDir=${inputDir} excludes=${excludes}`,
    );
    const watcher = Deno.watchFs([srcDir, inputDir], { recursive: true });
    for await (const evt of watcher) {
      if (
        !evt ||
        (evt.kind !== 'create' && evt.kind !== 'modify' &&
          evt.kind !== 'remove' && evt.kind !== 'rename') ||
        matchesGlobSync(excludes, evt.paths)
      ) continue;
      await rebundle(
        release,
        inputDir,
        srcDir,
        srcDataDir,
        distDir,
        excludes,
        baseUrl,
      );
    }
    return watcher;
  } catch (err) {
    console.error('watch error', err);
    throw err;
  }
}

async function rebundle(
  release: boolean = true,
  inputDir: string = DEFAULT_INPUT_DIR,
  srcDir: string = DEFAULT_SRC_DIR,
  srcDataDir: string = DEFAULT_SRC_DATA_DIR,
  distDir: string = DEFAULT_DIST_DIR,
  excludes: string[] = DEFAULT_WATCH_EXCLUDES,
  baseUrl: string = `http://${DEFAULT_SERVE_HOSTNAME}:${DEFAULT_SERVE_PORT}`,
): Promise<void> {
  clean();
  await importData(inputDir, srcDataDir);
  await bundle(release, distDir, baseUrl);
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['hostname', 'port', 'inputdir', 'srcdir', 'srcdatadir', 'distdir'],
    boolean: ['watch', 'release'],
    negatable: ['watch', 'release'],
    default: {
      hostname: DEFAULT_SERVE_HOSTNAME,
      port: DEFAULT_SERVE_PORT.toString(),
      inputdir: DEFAULT_INPUT_DIR,
      srcdir: DEFAULT_SRC_DIR,
      srcdatadir: DEFAULT_SRC_DATA_DIR,
      distdir: DEFAULT_DIST_DIR,
      watch: true,
      release: DEFAULT_RELEASE,
    },
  });

  try {
    await rebundle(
      args.release,
      args.inputdir,
      args.srcdir,
      args.srcdatadir,
      args.distdir,
      [join(args.srcdatadir, '**', '*'), DEFAULT_ENV_JSON],
      `http://${args.hostname}:${args.port}`,
    );
    watch(
      args.release,
      args.inputdir,
      args.srcdir,
      args.srcdatadir,
      args.distdir,
      [join(args.srcdatadir, '**', '*'), DEFAULT_ENV_JSON],
      `http://${args.hostname}:${args.port}`,
    );
    serveHttp(args.hostname, parseInt(args.port), args.distdir);
  } catch (err) {
    console.error(err);
  }
}

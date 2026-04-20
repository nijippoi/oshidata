import { serveDir } from '@std/http/file-server';
import { route } from '@std/http/unstable-route';
import { parseArgs } from '@std/cli';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_DATA_DIR,
  DEFAULT_DIST_DIR,
  DEFAULT_LABELS_DIR,
  DEFAULT_RES_DIR,
  DEFAULT_SERVE_HOSTNAME,
  DEFAULT_SERVE_PORT,
  DEFAULT_SRC_DIR,
  DEFAULT_TASKS_DIR,
  DEFAULT_WATCH_EXCLUDES,
  ENV_FILE,
  matchesGlobSync,
} from './utils.ts';
import { clean } from './clean.ts';
import { importData } from './import.ts';
import { bundle } from './bundle.ts';
import { join } from '@std/path';

export function serveHttp(
  hostname: string = DEFAULT_SERVE_HOSTNAME,
  port: number = DEFAULT_SERVE_PORT,
  rootDir: string = DEFAULT_DIST_DIR,
) {
  try {
    Deno.serve(
      {
        hostname,
        port,
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
        () => new Response('NOT_FOUND', { status: 404 }),
      ),
    );
  } catch (err) {
    console.error('serve error', err);
  }
}

export async function watch(
  release: boolean = true,
  resDir: string = DEFAULT_RES_DIR,
  dataDir: string = DEFAULT_DATA_DIR,
  labelsDir: string = DEFAULT_LABELS_DIR,
  srcDir: string = DEFAULT_SRC_DIR,
  distDir: string = DEFAULT_DIST_DIR,
  excludes: string[] = DEFAULT_WATCH_EXCLUDES,
  basePath: string = DEFAULT_BASE_PATH,
  baseUrl: string = `http://${DEFAULT_SERVE_HOSTNAME}:${DEFAULT_SERVE_PORT}`,
): Promise<Deno.FsWatcher> {
  try {
    const paths = [srcDir, resDir, DEFAULT_TASKS_DIR];
    console.log(`Watching paths=${paths} excludes=${excludes}`);
    const watcher = Deno.watchFs(paths, { recursive: true });
    for await (const evt of watcher) {
      if (
        !evt ||
        (evt.kind !== 'create' && evt.kind !== 'modify' &&
          evt.kind !== 'remove' && evt.kind !== 'rename') ||
        matchesGlobSync(excludes, evt.paths)
      ) continue;
      await rebundle(
        release,
        resDir,
        dataDir,
        labelsDir,
        srcDir,
        distDir,
        basePath,
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
  resDir: string = DEFAULT_RES_DIR,
  dataDir: string = DEFAULT_DATA_DIR,
  labelsDir: string = DEFAULT_LABELS_DIR,
  srcDir: string = DEFAULT_SRC_DIR,
  distDir: string = DEFAULT_DIST_DIR,
  basePath: string = DEFAULT_BASE_PATH,
  baseUrl: string = `http://${DEFAULT_SERVE_HOSTNAME}:${DEFAULT_SERVE_PORT}`,
): Promise<void> {
  clean();
  await importData(release, resDir, dataDir, labelsDir);
  await bundle(release, dataDir, labelsDir, srcDir, distDir, basePath, baseUrl);
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: [
      'hostname',
      'port',
      'resdir',
      'srcdir',
      'datadir',
      'labelsdir',
      'distdir',
      'basepath',
    ],
    boolean: ['watch', 'release'],
    negatable: ['watch', 'release'],
    default: {
      hostname: DEFAULT_SERVE_HOSTNAME,
      port: DEFAULT_SERVE_PORT.toString(),
      resdir: DEFAULT_RES_DIR,
      srcdir: DEFAULT_SRC_DIR,
      datadir: DEFAULT_DATA_DIR,
      labelsdir: DEFAULT_LABELS_DIR,
      distdir: DEFAULT_DIST_DIR,
      basepath: DEFAULT_BASE_PATH,
      watch: true,
      release: false,
    },
  });

  try {
    await rebundle(
      args.release,
      args.resdir,
      args.datadir,
      args.labelsdir,
      args.srcdir,
      args.distdir,
      args.basepath,
      `http://${args.hostname}:${args.port}`,
    );
    watch(
      args.release,
      args.resdir,
      args.datadir,
      args.labelsdir,
      args.srcdir,
      args.distdir,
      [join(args.datadir, '**', '*'), join(args.srcdir, ENV_FILE)],
      args.basepath,
      `http://${args.hostname}:${args.port}`,
    );
    serveHttp(args.hostname, parseInt(args.port), args.distdir);
  } catch (err) {
    console.error(err);
  }
}

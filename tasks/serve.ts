import { parseArgs } from '@std/cli';
import { join } from '@std/path';
import { type Route, route } from '@std/http/unstable-route';
import { serveDir } from '@std/http/file-server';
import { bundle } from './bundle.ts';

export async function serve(
  args: { root: string; port: number },
): Promise<void> {
  const uuid = self.crypto.randomUUID();
  try {
    const routes: Route[] = [
      {
        pattern: new URLPattern({
          pathname: '/.well-known/appspecific/com.chrome.devtools.json',
        }),
        handler: (req: Request) =>
          new Response(
            JSON.stringify({
              workspace: {
                uuid: uuid,
                root: args.root,
              },
            }),
            { status: 200 },
          ),
      },
      {
        pattern: new URLPattern({ pathname: '/*' }),
        handler: (req: Request) => serveDir(req, { fsRoot: args.root }),
      },
    ];

    await Deno.serve(
      {
        port: args.port,
        hostname: '127.0.0.1',
        handler: route(
          routes,
          () => new Response('not found', { status: 404 }),
        ),
      },
    );
  } catch (err) {
    console.error(err);
  }
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['root', 'http-port'],
    boolean: ['watch'],
    default: {
      root: join(Deno.cwd(), 'dist'),
      'http-port': '3000',
      watch: false,
    },
  });
  await bundle({ outdir: args.root, release: false });
  await serve({ root: args.root, port: parseInt(args['http-port']) });
}

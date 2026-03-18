import { parseArgs } from '@std/cli';
import { join } from '@std/path';

async function serve(
  opts: { dirs: string[]; httpPort: number },
): Promise<void> {
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['dir', 'http-port'],
    boolean: ['watch'],
    collect: ['dir'],
    default: {
      dir: [join(Deno.cwd(), 'dist')],
      'http-port': '3000',
      watch: false,
    },
  });

  try {
    await serve({
      dirs: args.dir,
      httpPort: parseInt(args['http-port']),
    });
  } catch (err) {
    console.error(err);
  }
}

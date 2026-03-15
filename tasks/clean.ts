import { existsSync } from '@std/fs';
import { join } from '@std/path';

if (import.meta.main) {
  const dirs = Deno.args.length > 0 ? Deno.args : [join(Deno.cwd(), 'dist')];
  console.log('removing', dirs);
  dirs.forEach((dir) => {
    if (existsSync(dir)) {
      Deno.removeSync(dir, { recursive: true });
    }
  });
}

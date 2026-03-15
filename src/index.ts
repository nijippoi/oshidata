import * as db from './db.ts';
import { resolvePersonName } from './utils.ts';

addEventListener('DOMContentLoaded', async () => {
  console.log(resolvePersonName({ id: '', names: [] }, new Date()));
  db.open();
});

import * as db from './db.ts';
import { resolvePersonName } from './utils.ts';
import './index.css';

addEventListener('DOMContentLoaded', async () => {
  console.log(resolvePersonName({ id: '', names: [] }, new Date()));
  db.open();
});

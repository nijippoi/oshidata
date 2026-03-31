import * as db from './db.ts';
import './index.css';

addEventListener('DOMContentLoaded', async () => {
  db.open();
});

import { resolvePersonName } from './utils.ts';

addEventListener('DOMContentLoaded', () => {
  console.log(resolvePersonName({ id: '', names: [] }, new Date()));
});

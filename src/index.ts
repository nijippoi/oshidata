import { registerAll } from './components/mod.ts';
import './index.css';
import { init } from './utils.ts';

addEventListener('DOMContentLoaded', async () => {
  init();
  registerAll();
});

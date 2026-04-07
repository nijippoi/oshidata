import { elem, LANGS, ns } from '../utils.ts';
import Component from './component.ts';

export class LanguageSelector extends Component {
  static NAME = ns('language-selector');

  constructor() {
    super();
  }

  render() {
    const ul = elem('ul');
    LANGS.forEach((lang) => {
      const li = elem('li');
      li.textContent = lang;
      ul.append(li);
    });
    this.shadow.append(ul);
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define(LanguageSelector.NAME, LanguageSelector);
export default LanguageSelector;

import { elem, LANGS, ns } from '../utils.ts';

export class LanguageSelector extends HTMLElement {
  static NAME = ns('language-selector');

  shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
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

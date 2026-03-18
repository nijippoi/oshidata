import { elem, LANGS } from '../utils.ts';
export class LangSelector extends HTMLElement {
  static TAG_NAME = 'lang-selector';

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

customElements.define(LangSelector.TAG_NAME, LangSelector);

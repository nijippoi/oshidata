import { elb, LANGS, ns } from '../utils.ts';
import Component from './component.ts';

export class LanguageSelector extends Component {
  static NAME = ns('language-selector');

  constructor() {
    super();
  }

  render() {
    const ul = elb('ul').elem();
    LANGS.forEach((lang) => {
      elb('li').txt(lang).attach(ul);
    });
    this.shadow.append(ul);
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define(LanguageSelector.NAME, LanguageSelector);
export default LanguageSelector;

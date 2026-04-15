import { elb, LOCALES, ns } from '../utils.ts';
import Component from './component.ts';

export class LocaleSelector extends Component {
  static NAME = ns('locale-selector');

  constructor() {
    super();
  }

  render() {
    const ul = elb('ul');
    LOCALES.forEach((key) => elb('li').txt(key).attach(ul));
    this.shadow.append(ul.elem());
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define(LocaleSelector.NAME, LocaleSelector);
export default LocaleSelector;

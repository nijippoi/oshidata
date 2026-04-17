import { cssRules, el, elb, ns } from '../utils.ts';
import Component from './component.ts';

const SHEET = cssRules(':host { display: block; background: var(--bg-1-color); padding: 10px; }');

export class Container extends Component {
  static NAME = ns('container');
  static EVENT_DISABLED = ns('container-disabled');

  static register(): void {
    Component.registerComponent(Container.NAME, Container);
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super({ css: SHEET });
    elb('div').add(el('slot')).attach(this.shadow);
    document.addEventListener(Container.EVENT_DISABLED, (evt) => {
      const data: boolean | undefined | null = (evt as CustomEvent).detail;
      if (data === true) {
        this.setAttribute('disabled', 'true');
      } else if (data === false) {
        this.setAttribute('disabled', 'false');
      }
    });
  }

  connectedCallback() {
    this.init();
  }

  attributeChangedCallback(
    name: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    switch (name) {
      case 'disabled':
        this.update();
        break;
    }
  }

  init(): void {
  }

  update(): void {
  }
}

export default Container;

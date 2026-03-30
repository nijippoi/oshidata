import { elem, ns } from '../utils.ts';
import HasLabel from './has-label.ts';

export class Container extends HasLabel {
  static NAME = ns('container');
  static EVENT_DISABLED = ns('container-disabled');

  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();
    const sheet = new CSSStyleSheet();
    sheet.insertRule(`
      :host {
        display: block;
        background: #ccc;
        padding: 10px;
      }
      `);
    this.shadowRoot!.adoptedStyleSheets.push(sheet);
    while (this.children.length > 0) {
      this.shadowRoot!.appendChild(this.children.item(0)!);
    }
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

customElements.define(Container.NAME, Container);
export default Container;

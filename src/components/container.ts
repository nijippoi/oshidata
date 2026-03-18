import { NAMESPACE } from '../utils.ts';

export class Container extends HTMLElement {
  static NAME = `${NAMESPACE}--container`;
  static EVENT_DISABLED = `${NAMESPACE}--container-disabled`;

  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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

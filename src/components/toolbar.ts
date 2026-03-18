import { clear, elem, LANGS, NAMESPACE } from '../utils.ts';

export class Toolbar extends HTMLElement {
  static NAME = `${NAMESPACE}--toolbar`;
  static EVENT_TITLE = `${NAMESPACE}--toolbar-title`;

  static fireChangeTitle(title?: string, subtitle?: string): void {
    const event = new CustomEvent(Toolbar.EVENT_TITLE, {
      detail: { title, subtitle },
    });
    document.dispatchEvent(event);
  }

  static get observedAttributes(): string[] {
    return ['title', 'subtitle'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    document.addEventListener(Toolbar.EVENT_TITLE, (evt) => {
      const data: { title?: string; subtitle?: string } =
        (evt as CustomEvent).detail;
      if (typeof data.title == 'string') this.setAttribute('title', data.title);
      if (typeof data.subtitle == 'string') {
        this.setAttribute('subtitle', data.subtitle);
      }
    });
  }

  connectedCallback() {
    this.init();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case 'title':
      case 'subtitle':
        if (oldValue !== newValue) {
          this.update();
        }
        break;
    }
  }

  init(): void {
    // left
    const left = elem('div');
    const attrTitle = this.getAttribute('title') || '';
    const attrSubtitle = this.getAttribute('subtitle') || '';
    left.append(elem('span', ['toolbar-title'], attrTitle));
    left.append(elem('span', ['toolbar-subtitle'], attrSubtitle));

    // right
    const right = elem('div');
    const langSelect = elem('select');
    LANGS.forEach((lang) => {
      const option = elem('option') as HTMLOptionElement;
      option.value = lang;
      option.textContent = lang;
      langSelect.append(option);
    });
    right.append(langSelect);

    const main = elem('div', ['toolbar-main']);
    main.append(left, right);
    clear(this.shadowRoot);
    this.shadowRoot?.appendChild(main);
  }

  update(): void {
    const toolbarTitle = this.shadowRoot?.querySelector(
      '.toolbar-title',
    ) as HTMLElement | null;
    if (toolbarTitle) {
      toolbarTitle.textContent = this.getAttribute('title') || '';
    }
    const toolbarSubtitle = this.shadowRoot?.querySelector(
      '.toolbar-subtitle',
    ) as HTMLElement | null;
    if (toolbarSubtitle) {
      toolbarSubtitle.textContent = this.getAttribute('subtitle') || '';
    }
  }
}

customElements.define(Toolbar.NAME, Toolbar);

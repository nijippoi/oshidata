import { clear, elem, LANGS, ns } from '../utils.ts';
import HasLabel from './has-label.ts';

export class Toolbar extends HasLabel {
  static NAME = ns('toolbar');
  static EVENT_TITLE = ns('toolbar-title');
  static EVENT_DATE_CHANGED = ns('toolbar-date-changed');

  static fireChangeTitle(
    title?: string,
    subtitle?: string,
  ): void {
    const evt = new CustomEvent(Toolbar.EVENT_TITLE, {
      detail: { title, subtitle },
    });
    document.dispatchEvent(evt);
  }

  static fireDateChanged(
    date: string,
  ): void {
    const evt = new CustomEvent(Toolbar.EVENT_DATE_CHANGED, {
      detail: { date },
    });
    document.dispatchEvent(evt);
  }

  static get observedAttributes(): string[] {
    return ['title', 'subtitle', 'date'];
  }

  constructor() {
    super();
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
      case 'date':
        if (oldValue !== newValue) {
          this.update();
        }
        break;
    }
  }

  init(): void {
    // left
    const left = elem('div', ['toolbar-left']);
    const attrTitle = this.getAttribute('title') || '';
    const attrSubtitle = this.getAttribute('subtitle') || '';
    left.append(elem('span', ['toolbar-title'], attrTitle));
    left.append(elem('span', ['toolbar-subtitle'], attrSubtitle));

    // right
    const right = elem('div', ['toolbar-right']);
    const langSelect = elem('select') as HTMLSelectElement;
    langSelect['name'] = 'l';
    LANGS.forEach((lang) => {
      const option = elem('option') as HTMLOptionElement;
      option.value = lang;
      option.textContent = lang;
      langSelect.append(option);
    });
    right.append(langSelect);
    const datePicker = elem('input') as HTMLInputElement;
    datePicker.setAttribute('type', 'date');
    if (!this.getAttribute('date')) {
      this.setAttribute('date', Temporal.Now.plainDateISO().toString());
    }
    datePicker.value = this.getAttribute('date')!;
    datePicker.addEventListener('change', (evt) => {
      const target = evt.target as HTMLInputElement | null;
      if (target) {
        Toolbar.fireDateChanged(target.value);
      }
    });
    right.append(datePicker);

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
export default Toolbar;

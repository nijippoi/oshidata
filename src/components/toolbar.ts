import { elem, LANGS, ns } from '../utils.ts';
import Component from './component.ts';

export class Toolbar extends Component {
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
    this.insertRule(`
      .toolbar-main {
        justify-content: space-between;
      }
      `);

    document.addEventListener(Toolbar.EVENT_TITLE, (evt) => {
      const data: { title?: string; subtitle?: string } =
        (evt as CustomEvent).detail;
      if (typeof data.title == 'string') this.setAttribute('title', data.title);
      if (typeof data.subtitle == 'string') {
        this.setAttribute('subtitle', data.subtitle);
      }
    });

    // left
    const left = elem('div', ['toolbar-left', 'flex']);
    const attrTitle = this.getAttribute('title') || '';
    const attrSubtitle = this.getAttribute('subtitle') || '';
    left.append(elem('span', ['toolbar-title'], attrTitle));
    left.append(elem('span', ['toolbar-subtitle'], attrSubtitle));

    // right
    const right = elem('div', ['toolbar-right', 'flex']);
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
    datePicker.name = ns('toolbar-datepicker');
    datePicker.type = 'date';
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

    const changeMetaColorScheme = (value: string) => {
      return (evt: Event) => {
        const metaColorScheme = document.querySelector(
          'meta[name=color-scheme]',
        );
        if (metaColorScheme) {
          (metaColorScheme as HTMLMetaElement).content = value;
        } else {
          const newMetaColorScheme = elem('meta') as HTMLMetaElement;
          newMetaColorScheme.name = 'color-scheme';
          newMetaColorScheme.content = value;
          document.head.appendChild(newMetaColorScheme);
        }
        this.shadow.querySelectorAll('.color-scheme-button-group button')
          .forEach((btn) => {
            btn.classList.remove('selected');
            btn.classList.add('deselected');
          });
        switch (value) {
          case 'light dark': {
            const btn = this.shadow.querySelector('.auto-mode-button');
            btn?.classList.remove('deselected');
            btn?.classList.add('selected');
            break;
          }
          case 'light': {
            const btn = this.shadow.querySelector('.light-mode-button');
            btn?.classList.remove('deselected');
            btn?.classList.add('selected');
            break;
          }
          case 'dark': {
            const btn = this.shadow.querySelector('.dark-mode-button');
            btn?.classList.remove('deselected');
            btn?.classList.add('selected');
            break;
          }
          default:
            break;
        }
      };
    };
    const lightDarkAuto = elem('button', [
      'auto-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ]) as HTMLButtonElement;
    lightDarkAuto.ariaPressed = 'true';
    lightDarkAuto.value = 'light dark';
    lightDarkAuto.textContent = 'brightness_auto';
    lightDarkAuto.addEventListener(
      'click',
      changeMetaColorScheme('light dark'),
    );
    const lightDarkLight = elem('button', [
      'light-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ]) as HTMLButtonElement;
    lightDarkLight.ariaPressed = 'false';
    lightDarkLight.value = 'light';
    lightDarkLight.textContent = 'light_mode';
    lightDarkLight.addEventListener('click', changeMetaColorScheme('light'));
    const lightDarkDark = elem('button', [
      'dark-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ]) as HTMLButtonElement;
    lightDarkDark.ariaPressed = 'false';
    lightDarkDark.value = 'dark';
    lightDarkDark.textContent = 'dark_mode';
    lightDarkDark.addEventListener('click', changeMetaColorScheme('dark'));
    const lightDarkSection = elem('section', [
      'button-group',
      'color-scheme-button-group',
    ]);
    lightDarkSection.ariaLabel = 'ライト・ダーク切り替え';
    lightDarkSection.appendChild(lightDarkAuto);
    lightDarkSection.appendChild(lightDarkLight);
    lightDarkSection.appendChild(lightDarkDark);
    right.append(lightDarkSection);

    const main = elem('div', ['toolbar-main', 'flex']);
    main.append(left, right);
    // clear(this.shadow);
    this.shadow.appendChild(main);
  }

  update(): void {
    const toolbarTitle = this.shadow.querySelector(
      '.toolbar-title',
    ) as HTMLElement | null;
    if (toolbarTitle) {
      toolbarTitle.textContent = this.getAttribute('title') || '';
    }
    const toolbarSubtitle = this.shadow.querySelector(
      '.toolbar-subtitle',
    ) as HTMLElement | null;
    if (toolbarSubtitle) {
      toolbarSubtitle.textContent = this.getAttribute('subtitle') || '';
    }
  }
}

customElements.define(Toolbar.NAME, Toolbar);
export default Toolbar;

import { cssRules, currentPlainDate, elb, formatDate, ns } from '../utils.ts';
import Component from './component.ts';
import LocaleSelector from './locale-selector.ts';

const SHEET = cssRules('.toolbar-main { justify-content: space-between; }');

export class Toolbar extends Component {
  static NAME = ns('toolbar');
  static EVENT_TITLE = ns('toolbar-title');
  static EVENT_DATE_CHANGED = ns('toolbar-date-changed');

  static register(): void {
    Component.registerComponent(Toolbar.NAME, Toolbar);
  }

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
    super({ css: SHEET });
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
    document.addEventListener(Toolbar.EVENT_TITLE, (evt) => {
      const data: { title?: string; subtitle?: string } = (evt as CustomEvent).detail;
      if (typeof data.title == 'string') this.setAttribute('title', data.title);
      if (typeof data.subtitle == 'string') {
        this.setAttribute('subtitle', data.subtitle);
      }
    });

    // left
    const attrTitle = this.getAttribute('title') || '';
    const attrSubtitle = this.getAttribute('subtitle') || '';
    const left = elb('div').cls('toolbar-left', 'flex').add(
      elb('span').cls('toolbar-title').txt(attrTitle),
      elb('span').cls('toolbar-subtitle').txt(attrSubtitle),
    );

    // right
    const right = elb('div').cls('toolbar-right', 'flex');

    const localeSelector = new LocaleSelector();
    localeSelector.classList.add('inline-flex');
    right.add(localeSelector);

    const datePicker = elb('input').evt('change', (evt) => {
      const target = evt.target as HTMLInputElement | null;
      if (target) {
        Toolbar.fireDateChanged(target.value);
      }
    }).elem() as HTMLInputElement;
    datePicker.name = ns('toolbar-datepicker');
    datePicker.type = 'date';
    if (!this.getAttribute('date')) {
      this.setAttribute('date', formatDate(currentPlainDate()));
    }
    datePicker.value = this.getAttribute('date')!;
    right.add(datePicker);

    const changeMetaColorScheme = (value: string) => {
      return (evt: Event) => {
        const metaColorScheme = document.querySelector(
          'meta[name=color-scheme]',
        );
        if (metaColorScheme) {
          (metaColorScheme as HTMLMetaElement).content = value;
        } else {
          const newMetaColorScheme = elb('meta').elem() as HTMLMetaElement;
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
    const lightDarkAuto = elb('button').txt('brightness_auto').cls(
      'auto-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ).attr('aria-pressed', 'true').attr('value', 'light dark').evt(
      'click',
      changeMetaColorScheme('light dark'),
    );
    const lightDarkLight = elb('button').txt('light_mode').cls(
      'light-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ).attr('aria-pressed', 'false').attr('value', 'light').evt(
      'click',
      changeMetaColorScheme('light'),
    );
    const lightDarkDark = elb('button').txt('dark_mode').cls(
      'dark-mode-button',
      'inline-button',
      'material-symbols-outlined',
    ).attr('aria-pressed', 'false').attr('value', 'dark').evt(
      'click',
      changeMetaColorScheme('dark'),
    );
    elb('section').cls(
      'button-group',
      'color-scheme-button-group',
    ).add(lightDarkAuto, lightDarkLight, lightDarkDark).attr(
      'aria-label',
      'ライト・ダーク切り替え',
    ).attach(right);

    elb('div').cls('toolbar-main', 'flex').add(left, right).attach(
      this.shadow,
    );
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

export default Toolbar;

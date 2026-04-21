import { fireLocaleChanged } from '../label.ts';
import { el, elb, locale, LOCALES, ns, STORAGE_KEY_LOCALE } from '../utils.ts';
import Component from './component.ts';

export class LocaleSelector extends Component {
  static NAME = ns('locale-selector');

  static register(): void {
    Component.registerComponent(LocaleSelector.NAME, LocaleSelector);
  }

  constructor() {
    super();
    const storedLocale = localStorage.getItem(STORAGE_KEY_LOCALE) || '';
    elb('select', {
      attributes: {
        name: 'locale',
      },
      listeners: {
        change: (evt) => {
          const oldValue = locale();
          const newValue = (evt.target as HTMLSelectElement).value;
          if (newValue) {
            localStorage.setItem(STORAGE_KEY_LOCALE, (evt.target as HTMLSelectElement).value);
          } else {
            localStorage.removeItem(STORAGE_KEY_LOCALE);
          }
          if (oldValue !== newValue) fireLocaleChanged(newValue, oldValue);
        },
      },
      children: [el('option', {
        dataset: {
          'label-text': 'nouns.auto',
        },
        attributes: {
          value: '',
          ...(storedLocale === '' && { selected: '' }),
        },
      })].concat(LOCALES.map((key) =>
        el('option', {
          attributes: {
            value: key,
            ...(storedLocale === key && { selected: '' }),
          },
          children: [key],
        })
      )),
    }).attach(this.shadow);
  }
}

export default LocaleSelector;

import { fireLocaleChanged } from '../label.ts';
import { elb, locale, LOCALES, ns, STORAGE_KEY_LOCALE } from '../utils.ts';
import Component from './component.ts';

export class LocaleSelector extends Component {
  static NAME = ns('locale-selector');

  static register(): void {
    Component.registerComponent(LocaleSelector.NAME, LocaleSelector);
  }

  constructor() {
    super();
    const select = elb('select').attr('name', 'locale').evt('change', (evt) => {
      const oldValue = locale();
      const newValue = (evt.target as HTMLSelectElement).value;
      if (newValue) {
        localStorage.setItem(STORAGE_KEY_LOCALE, (evt.target as HTMLSelectElement).value);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCALE);
      }
      if (oldValue !== newValue) fireLocaleChanged(newValue, oldValue);
    });
    const storedLocale = localStorage.getItem(STORAGE_KEY_LOCALE) || '';
    elb('option', {
      dataset: {
        'label-text': 'nouns.auto',
      },
      attributes: {
        value: '',
        ...(storedLocale === '' && { selected: '' }),
      },
    }).attach(select);
    LOCALES.forEach((key) => {
      const opt = elb('option').txt(key).attr('value', key);
      if (storedLocale === key) {
        opt.attr('selected', '');
      }
      opt.attach(select);
    });
    this.shadow.append(select.elem());
  }
}

export default LocaleSelector;

import { formatAge, formatDate, formatDayDuration, formatRange, LABELS_PATH, lang, LANGS, ns } from './utils.ts';
import { baseUrl } from './env.ts';
import type { Labels } from './types.ts';

const LABELS: { [keyof: string]: Labels } = {};

async function load(
  langKey: string,
): Promise<Labels> {
  console.log(`Fetching label ${langKey}`);
  return await fetch(`${baseUrl}${LABELS_PATH}/${langKey}.json`).then((res) => res.json());
}

export async function label(
  key: string,
  params?: { [key: string]: string },
): Promise<string | undefined> {
  let langKey = lang();
  if (LANGS.indexOf(langKey) < 0) {
    langKey = LANGS[0];
  }
  if (!LABELS[langKey]) {
    await navigator.locks.request(
      `label_load_${langKey}`,
      { mode: 'exclusive' },
      async (_lock) => {
        if (!LABELS[langKey]) {
          LABELS[langKey] = await load(langKey);
        }
      },
    );
  }
  const text = LABELS[langKey][key];
  if (!text) {
    console.log(`label not found for key '${key}'`);
  }
  return text;
}

const LABEL_DATA_ATTRS = [
  'text',
  'attr-name',
  'attr-key',
  'date',
  'age',
  'age-base',
  'date-range-start',
  'date-range-end',
  'date-range-base',
  'date-range-show-duration',
  'placeholder',
].map((a) => `data-label-${a}`);
const LABEL_DATA_SELECTORS = LABEL_DATA_ATTRS.map((a) => `[${a}]`).join(',');

function renderLabels(root: HTMLElement | ShadowRoot) {
  const labelElems = root.querySelectorAll(LABEL_DATA_SELECTORS);
  labelElems.forEach((elem) => {
    // console.log(elem);
    if (elem instanceof HTMLElement) {
      if (elem.dataset.labelText) {
        label(elem.dataset.labelText).then((text) => {
          elem.textContent = text || '';
        });
      }
      if (elem.dataset.labelAttrKey && elem.dataset.labelAttrName) {
        const keys = elem.dataset.labelAttrKey.split(',');
        const names = elem.dataset.labelAttrName.split(',');
        for (let i = 0; i < Math.min(keys.length, names.length); i++) {
          const key = keys[i];
          const name = names[i];
          label(key).then((text) => {
            elem.setAttribute(name, text || '');
          });
        }
      }
      if (elem.dataset.labelDateRangeStart || elem.dataset.labelDateRangeEnd) {
        const start = elem.dataset.labelDateRangeStart
          ? Temporal.PlainDate.from(elem.dataset.labelDateRangeStart)
          : undefined;
        const end = elem.dataset.labelDateRangeEnd
          ? Temporal.PlainDate.from(elem.dataset.labelDateRangeEnd)
          : undefined;
        const range = formatRange(start, end);
        if (
          elem.dataset.labelDateRangeShowDuration !== undefined && elem.dataset.labelDateRangeShowDuration !== 'false'
        ) {
          if (start && end) {
            const duration = formatDayDuration(start, end, false);
            elem.textContent = `${range} (${duration})`;
          } else if (start || end) {
            const baseDate = elem.dataset.labelDateRangeBase
              ? Temporal.PlainDate.from(elem.dataset.labelDateRangeBase)
              : Temporal.Now.plainDateISO();
            const duration = formatDayDuration(
              start || baseDate,
              end || baseDate,
              false,
            );
            elem.textContent = `${range} (${duration})`;
          }
        } else {
          elem.textContent = range;
        }
      }
      if (elem.hasAttribute('data-label-date')) {
        elem.textContent = elem.dataset.labelDate ? formatDate(Temporal.PlainDate.from(elem.dataset.labelDate)) : '';
      }
      if (elem.hasAttribute('data-label-age')) {
        elem.textContent = elem.dataset.labelAge
          ? formatAge(
            Temporal.PlainDate.from(elem.dataset.labelAge),
            elem.dataset.labelAgeBase
              ? Temporal.PlainDate.from(elem.dataset.labelAgeBase)
              : Temporal.Now.plainDateISO(),
          )
          : '';
      }
      if (elem.hasAttribute('data-label-placeholder')) {
        label(elem.dataset.labelPlaceholder!).then((text) => {
          elem.setAttribute('placeholder', text || '');
        });
      }
    }
  });
}

export const EVENT_LOCALE_CHANGED = ns('locale-changed');

export function listenLocaleChanged(node: HTMLElement | ShadowRoot) {
  document.addEventListener(EVENT_LOCALE_CHANGED, (evt) => {
    // console.log('onLocaleChanged', evt, node);
    renderLabels(node);
  });
}

export function fireLocaleChanged(newValue?: string, oldValue?: string) {
  // console.log('fireLocaleChanged', newValue, oldValue);
  document.dispatchEvent(
    new CustomEvent(EVENT_LOCALE_CHANGED, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: { newValue, oldValue },
    }),
  );
}

function handleMutation(mutations: MutationRecord[], observer: MutationObserver) {
  for (const mutation of mutations) {
    // console.log('Mutation found', mutation.target);
    switch (mutation.type) {
      case 'childList':
        mutation.addedNodes.forEach((node) => {
          // console.log('Node is added', node);
          if (node instanceof HTMLElement || node instanceof ShadowRoot) {
            renderLabels(node);
            listenLocaleChanged(node);
          }
        });
        // mutation.removedNodes.forEach((node) => {
        //   console.log('Node is removed', node);
        // });
        break;
      case 'attributes':
        console.log(
          'Attribute is modified',
          mutation.attributeName,
          mutation.oldValue,
        );
        if (
          mutation.target instanceof HTMLElement ||
          mutation.target instanceof ShadowRoot
        ) {
          renderLabels(mutation.target);
          listenLocaleChanged(mutation.target);
        }
        break;
      default:
        console.warn('Unhandled mutation', mutation);
    }
  }
}

class LabelObserver {
  static instance: LabelObserver;
  observer!: MutationObserver;

  constructor() {
    if (LabelObserver.instance) {
      return LabelObserver.instance;
    }
    this.observer = new MutationObserver(handleMutation);
    LabelObserver.instance = this;
  }

  disconnect() {
    this.observer.disconnect();
  }

  observe(
    node: Node,
    options: MutationObserverInit = {
      attributes: true,
      attributeFilter: LABEL_DATA_ATTRS,
      childList: true,
      subtree: true,
    },
  ) {
    this.observer.observe(node, options);
  }

  static get() {
    if (!LabelObserver.instance) {
      LabelObserver.instance = new LabelObserver();
    }
    return LabelObserver.instance;
  }
}

export function bind(node: Node): void {
  LabelObserver.get().observe(node);
}

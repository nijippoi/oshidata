import { LABELS_PATH, lang, LANGS } from './utils.ts';
import { baseUrl } from './env.ts';
import type { Labels } from './types.ts';

const LABELS: { [keyof: string]: Labels } = {};

async function load(
  langKey: string,
): Promise<Labels> {
  console.log(`Fetching label ${langKey}`);
  return await fetch(`${baseUrl}${LABELS_PATH}/${langKey}.json`).then((res) =>
    res.json()
  );
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
      'label_load',
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

function renderLabels(root: HTMLElement | ShadowRoot) {
  const labelElems = root.querySelectorAll(
    '[data-label-attr-name],[data-label-attr-key],[data-label-text]',
  );
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
    }
  });
}

function observeNode(mutations: MutationRecord[], observer: MutationObserver) {
  for (const mutation of mutations) {
    // console.log('Mutation found', mutation.target);
    switch (mutation.type) {
      case 'childList':
        mutation.addedNodes.forEach((node) => {
          // console.log('Node is added', node);
          if (node instanceof HTMLElement || node instanceof ShadowRoot) {
            renderLabels(node);
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
        }
        break;
      default:
        console.log('Unhandled mutation', mutation);
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
    this.observer = new MutationObserver(observeNode);
    LabelObserver.instance = this;
  }

  disconnect() {
    this.observer.disconnect();
  }

  observe(
    node: Node,
    options: MutationObserverInit = {
      attributes: true,
      attributeFilter: [
        'data-label-text',
        'data-label-attr-name',
        'data-label-attr-key',
      ],
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

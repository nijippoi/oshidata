import { lang, LANGS } from './utils.ts';

const LABELS: { [key: string]: { [key: string]: string } } = {};

async function load(
  langKey: string,
): Promise<{ [key: string]: string }> {
  console.log(`loading labels for ${langKey}`);
  return await import(`./labels/${langKey}.json`, { with: { type: 'json' } });
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
  return LABELS[langKey][key];
}

function observeNode(mutations: MutationRecord[], observer: MutationObserver) {
  for (const mutation of mutations) {
    // console.log('Mutation found', mutation.target);
    switch (mutation.type) {
      case 'childList':
        mutation.addedNodes.forEach((node) => {
          console.log('Node is added', node);
        });
        mutation.removedNodes.forEach((node) => {
          console.log('Node is removed', node);
        });
        break;
      case 'attributes':
        console.log(
          'Attribute is modified',
          mutation.attributeName,
          mutation.oldValue,
        );
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

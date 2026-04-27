import { clear, cssRules, el, ns } from '../utils.ts';
import Component from './component.ts';

export interface MultiselectItem {
  key: string;
  label: string;
}

const SHEET = cssRules(
  ':host { display: block; position: relative; z-index: 1; }',
  '.ms-root { margin-bottom: 8px; }',
  '.ms-chips { display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; margin-bottom: 4px; }',
  '.ms-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background-color: var(--bg-0-color); border: 1px solid var(--border-color); font-size: 0.85em; }',
  '.ms-chip button { border: none; background: none; cursor: pointer; padding: 0 2px; color: var(--text-2-color); font-size: 1em; line-height: 1; }',
  '.ms-chip button:hover { color: var(--text-0-color); }',
  '.ms-field { position: relative; }',
  '.ms-input { width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid var(--border-color); background-color: var(--bg-0-color); color: var(--text-0-color); font-size: 1em; }',
  '.ms-list { position: absolute; left: 0; right: 0; top: 100%; z-index: 10; margin-top: -1px; max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-top: none; background-color: var(--bg-0-color); }',
  '.ms-list:empty { display: none; }',
  '.ms-field:not(:focus-within) .ms-list { display: none; }',
  '.ms-list label { display: flex; align-items: center; gap: 6px; padding: 4px 8px; cursor: pointer; }',
  '.ms-list label:hover { background-color: var(--bg-1-color); }',
  '.ms-list label input[type="checkbox"] { cursor: pointer; }',
);

export class Multiselect extends Component {
  static NAME = ns('multiselect');
  static EVENT_CHANGE = ns('multiselect-change');

  static register(): void {
    Component.registerComponent(Multiselect.NAME, Multiselect);
  }

  static get observedAttributes() {
    return ['placeholder-key'];
  }

  private items: MultiselectItem[] = [];
  private selectedKeys: Set<string> = new Set();
  private chipsContainer: HTMLElement | null = null;
  private listContainer: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private suppressChangeEvent = false;

  constructor() {
    super({ css: SHEET });
  }

  connectedCallback() {
    this.ensureDom();
    this.applyPlaceholder();
  }

  attributeChangedCallback(name: string) {
    if (name === 'placeholder-key') {
      this.applyPlaceholder();
    }
  }

  /** Replace candidate rows (labels are shown in the list and on chips). */
  setItems(items: MultiselectItem[]): void {
    this.items = items.slice();
    this.refreshListFromInput();
    this.renderChips();
  }

  /** Replace selection without emitting {@link Multiselect.EVENT_CHANGE}. */
  setSelectedKeys(keys: Iterable<string>): void {
    this.suppressChangeEvent = true;
    try {
      this.selectedKeys = new Set(keys);
      this.refreshListFromInput();
      this.renderChips();
    } finally {
      this.suppressChangeEvent = false;
    }
  }

  getSelectedKeys(): string[] {
    return Array.from(this.selectedKeys);
  }

  private emitChange(): void {
    if (this.suppressChangeEvent) return;
    this.dispatchEvent(
      new CustomEvent(Multiselect.EVENT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: { keys: this.getSelectedKeys() },
      }),
    );
  }

  private toggleKey(key: string, selected: boolean): void {
    if (selected) {
      this.selectedKeys.add(key);
    } else {
      this.selectedKeys.delete(key);
    }
  }

  private ensureDom(): void {
    if (this.chipsContainer) return;

    const root = el('div', { classes: ['ms-root'] });
    this.chipsContainer = el('div', { classes: ['ms-chips'] });
    this.listContainer = el('div', { classes: ['ms-list'] });

    this.searchInput = el('input', {
      classes: ['ms-input'],
      attributes: {
        'name': 'multiselect-input',
        'type': 'text',
      },
      listeners: {
        'input': (evt) => {
          this.refreshListFromInput((evt.target as HTMLInputElement).value);
        },
      },
    }) as HTMLInputElement;

    this.applyPlaceholder();

    const field = el('div', { classes: ['ms-field'] });
    field.append(this.searchInput, this.listContainer);
    root.append(this.chipsContainer, field);
    this.shadow.appendChild(root);
  }

  private applyPlaceholder(): void {
    if (!this.searchInput) return;
    const key = this.getAttribute('placeholder-key')?.trim();
    if (key) {
      this.searchInput.dataset.labelPlaceholder = key;
    } else {
      delete this.searchInput.dataset.labelPlaceholder;
    }
  }

  private renderChips(): void {
    this.ensureDom();
    const chips = this.chipsContainer!;
    clear(chips);
    const byKey = new Map(this.items.map((i) => [i.key, i]));
    for (const key of this.selectedKeys) {
      const item = byKey.get(key);
      if (!item) continue;
      const k = key;
      chips.appendChild(
        el('span', {
          classes: ['ms-chip'],
          children: [
            item.label,
            el('button', {
              children: ['×'],
              listeners: {
                'click': () => {
                  this.toggleKey(k, false);
                  this.renderChips();
                  this.refreshListFromInput(this.searchInput?.value ?? '');
                  this.emitChange();
                },
              },
            }),
          ],
        }),
      );
    }
  }

  private refreshListFromInput(rawFilter?: string): void {
    this.ensureDom();
    const list = this.listContainer!;
    clear(list);
    const filter = rawFilter ?? this.searchInput?.value ?? '';
    if (!filter.trim()) {
      return;
    }
    const lower = filter.toLowerCase();
    for (const item of this.items) {
      if (!item.label.toLowerCase().includes(lower)) continue;
      const checkbox = el('input', {
        attributes: { 'type': 'checkbox', 'value': item.key },
        listeners: {
          'change': (evt) => {
            this.toggleKey(item.key, (evt.target as HTMLInputElement).checked);
            this.renderChips();
            this.emitChange();
          },
        },
      }) as HTMLInputElement;
      checkbox.checked = this.selectedKeys.has(item.key);
      el('label', {
        children: [checkbox, el('span', { children: [item.label] })],
        attach: list,
      });
    }
  }
}

export default Multiselect;

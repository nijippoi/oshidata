import { elem, ns } from '../utils.ts';
import Component from './component.ts';

export class RadioIcons extends Component {
  static NAME = ns('radio-icons');

  choices: Map<string, string>;
  name: string;
  checked?: string;

  constructor(name?: string, choices?: Map<string, string>, checked?: string) {
    super();
    if (!name && !this.getAttribute('name')) throw new Error('nameは必須です');
    this.name = name || this.getAttribute('name')!;
    this.choices = choices || new Map();
    this.checked = checked;
    this.setAttribute('name', this.name);
  }

  connectedCallback() {
    this.init();
  }

  attributeChangedCallback(
    name: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    switch (name) {
      case 'disabled':
        this.update();
        break;
    }
  }

  init(): void {
    this.insertRule(`
      .radio-icons {
        display: inline-block;
      }
      `);
    this.insertRule(`
      .radio-icons input[type="radio"] {
        display: none;
      }
      `);
    this.insertRule(`
      .radio-icons > label {
        vertical-align: bottom;
      }
      `);
    this.insertRule(`
      .radio-icons > label:has(input[type="radio"]) {
        opacity:0.2;
      }
      `);
    this.insertRule(`
      .radio-icons > label:has(input[type="radio"]:checked) {
        opacity:1;
      }
      `);
    const group = elem('div', ['radio-icons']);
    this.choices.keys().forEach((key) => {
      const input = elem('input', []) as HTMLInputElement;
      input.type = 'radio';
      input.name = this.name;
      input.value = key;
      if (this.checked === key) input.checked = true;
      const label = elem('label', [
        'material-symbols-outlined',
      ]) as HTMLLabelElement;
      label.textContent = this.choices.get(key)!;
      label.appendChild(input);
      label.addEventListener('click', (evt) => {
        input.checked = true;
      });
      group.appendChild(label);
    });
    this.shadow.appendChild(group);
  }

  update(): void {
  }
}

customElements.define(RadioIcons.NAME, RadioIcons);
export default RadioIcons;

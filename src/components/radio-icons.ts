import { elb, ns } from '../utils.ts';
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
    const group = elb('div').cls('radio-icons').elem();
    this.choices.keys().forEach((key) => {
      const input = elb('input').elem() as HTMLInputElement;
      input.type = 'radio';
      input.name = this.name;
      input.value = key;
      if (this.checked === key) input.checked = true;
      elb('label').cls('material-symbols-outlined').add(
        this.choices.get(key)!,
        input,
      ).evt('click', (evt) => {
        input.checked = true;
      }).attach(group);
    });
    this.shadow.appendChild(group);
  }

  update(): void {
  }
}

customElements.define(RadioIcons.NAME, RadioIcons);
export default RadioIcons;

import { bind } from '../label.ts';
import { cssRules, ns } from '../utils.ts';

const ELEMENT_ID_MATERIAL_SYMBOLS_LINK = ns('material-symbols-css-link');

export function addMaterialSymbolsLink(): void {
  const materialSymbolsLink = document.getElementById(ELEMENT_ID_MATERIAL_SYMBOLS_LINK);
  if (!materialSymbolsLink) {
    const link = document.createElement('link') as HTMLLinkElement;
    link.id = ELEMENT_ID_MATERIAL_SYMBOLS_LINK;
    link.rel = 'stylesheet';
    link.crossOrigin = '';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
    document.head.appendChild(link);
  }
}

const SHEET = cssRules(
  `:host {
    /* background: var(--bg-0-color); */
    /* color: var(--text-0-color); */
  }`,
  `/* fallback */
  @font-face {
    font-family: 'Material Symbols Outlined';
    font-style: normal;
    font-weight: 400;
    src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v323/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2) format('woff2');
  }`,
  `.material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    /* font-size: 24px; */
    font-size: 1rem;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
      document.head.appendChild(link);
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    font-feature-settings: 'liga';
    font-smoothing: antialiased;
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }`,
  `td, th {
    vertical-align: top;
  }`,
  `.flex {
    display: flex;
  }`,
  `.inline-flex {
    display: inline-flex;
  }`,
  `.inline-block {
    display: inline-block;
  }`,
  `.inline-button {
    line-height: 1rem;
    vertical-align: middle;
    padding-inline: 2px;
  }`,
  `.button-group {
    display: flex;
  }`,
  `.button-group button {
    border-style: solid;
    border-width: 1px;
    border-radius: 2px;
  }`,
  `.button-group button:not(:last-child) {
    border-right-width: 0px;
    border-top-right-radius: unset;
    border-bottom-right-radius: unset;
  }`,
  `.button-group button:not(:first-child) {
    border-left-width: 0px;
    border-top-left-radius: unset;
    border-bottom-left-radius: unset;
  }`,
  `.selected {
    color: var(--text-selected-color);
  }`,
  `.deselected {
    color: var(--text-deselected-color);
  }`,
);

export abstract class Component extends HTMLElement {
  static registerComponent(name: string, component: CustomElementConstructor): void {
    if (!customElements.get(name)) {
      customElements.define(name, component);
    }
  }

  shadow: ShadowRoot;
  constructor(init?: {
    shadow?: ShadowRootInit;
    css?: CSSStyleSheet;
    label?: {
      bind?: boolean;
    };
  }) {
    addMaterialSymbolsLink();
    super();
    this.shadow = this.attachShadow(init?.shadow || { mode: 'open' });
    this.shadow.adoptedStyleSheets.push(SHEET);
    if (init?.css) this.shadow.adoptedStyleSheets.push(init.css);
    if (!(init?.label?.bind === false)) bind(this.shadow);
  }
}

export default Component;

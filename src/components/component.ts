import { bind } from '../label.ts';
import { ns } from '../utils.ts';

const commonCss = new CSSStyleSheet();
commonCss.insertRule(`
:host {
  /* background: var(--bg-0-color); */
  /* color: var(--text-0-color); */
}
`);
commonCss.insertRule(`
/* fallback */
@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v323/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2) format('woff2');
}
`);
commonCss.insertRule(`
.material-symbols-outlined {
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
}
`);
commonCss.insertRule(`
td, th {
  vertical-align: top;
}
`);
commonCss.insertRule(`
.flex {
  display: flex;
}
`);
commonCss.insertRule(`
.inline-block {
  display: inline-block;
}
`);
commonCss.insertRule(`
.inline-button {
  line-height: 1rem;
  vertical-align: middle;
  padding-inline: 2px;
}
`);
commonCss.insertRule(`
.button-group {
  display: flex;
}
`);
commonCss.insertRule(`
.button-group button {
  border-style: solid;
  border-width: 1px;
  border-radius: 2px;
}
`);
commonCss.insertRule(`
.button-group button:not(:last-child) {
  border-right-width: 0px;
  border-top-right-radius: unset;
  border-bottom-right-radius: unset;
}
`);
commonCss.insertRule(`
.button-group button:not(:first-child) {
  border-left-width: 0px;
  border-top-left-radius: unset;
  border-bottom-left-radius: unset;
}
`);
commonCss.insertRule(`
.selected {
  color: var(--text-selected-color);
}
`);
commonCss.insertRule(`
.deselected {
  color: var(--text-deselected-color);
}
`);

function addMaterialSymbolsLink(): void {
  const materialSymbolsLinkId = ns('material-symbols-css-link');
  const materialSymbolsLink = document.getElementById(materialSymbolsLinkId);
  if (!materialSymbolsLink) {
    const link = document.createElement('link') as HTMLLinkElement;
    link.id = materialSymbolsLinkId;
    link.rel = 'stylesheet';
    link.crossOrigin = '';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
    document.head.appendChild(link);
  }
}

export class Component extends HTMLElement {
  shadow: ShadowRoot;
  sheet: CSSStyleSheet;
  constructor(init?: {
    shadow?: ShadowRootInit;
    css?: CSSStyleSheet;
    label?: {
      bind?: boolean;
    };
  }) {
    addMaterialSymbolsLink();
    super();
    this.sheet = init?.css || new CSSStyleSheet();
    this.shadow = this.attachShadow(init?.shadow || { mode: 'open' });
    this.shadow.adoptedStyleSheets.push(commonCss);
    this.shadow.adoptedStyleSheets.push(this.sheet);
    if (!(init?.label?.bind === false)) bind(this.shadow);
  }
  insertRule(rule: string, index?: number) {
    this.sheet.insertRule(rule, index);
  }
}

export default Component;

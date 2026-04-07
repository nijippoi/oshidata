import { bind } from '../label.ts';

const sheet = new CSSStyleSheet();
sheet.insertRule(`
:host {
  background: var(--bg-0-color);
  color: var(--text-0-color);
}
`);
sheet.insertRule(`
/* fallback */
@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v323/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2) format('woff2');
}
`);
sheet.insertRule(`
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
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-feature-settings: 'liga';
  font-smoothing: antialiased;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
`);
sheet.insertRule(`
.inline-block {
  display: inline-block;
}
`);
sheet.insertRule(`
.inline-button {
  line-height: 1rem;
  vertical-align: middle;
  padding-inline: 2px;
}
`);

export class Component extends HTMLElement {
  shadow: ShadowRoot;
  constructor(init?: {
    shadow?: ShadowRootInit;
    label?: {
      bind?: boolean;
    };
  }) {
    super();
    this.shadow = this.attachShadow(init?.shadow || { mode: 'open' });
    this.shadow.adoptedStyleSheets.push(sheet);
    // const link = elem('link') as HTMLLinkElement;
    // link.rel = 'stylesheet';
    // link.href =
    //   'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
    // this.shadow.appendChild(link);
    if (!(init?.label?.bind === false)) bind(this.shadow);
  }
}

export default Component;

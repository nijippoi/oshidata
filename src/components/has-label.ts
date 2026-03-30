import { bind } from '../label.ts';

export class HasLabel extends HTMLElement {
  constructor(init?: {
    shadow?: ShadowRootInit;
    label?: {
      bind?: boolean;
    };
  }) {
    super();
    const shadow = this.attachShadow(init?.shadow || { mode: 'open' });
    bind(shadow);
  }
}

export default HasLabel;

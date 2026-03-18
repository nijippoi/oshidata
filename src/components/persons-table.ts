import { elem, NAMESPACE } from '../utils.ts';

export interface Query {
  groupIds?: string[];
  personIds?: string[];
  columns?: string[];
  page?: number;
  limit?: number;
  order?: string[];
}

export class PersonsTable extends HTMLElement {
  static NAME = `${NAMESPACE}--persons-table`;
  static EVENT_QUERY = `${NAMESPACE}--persons-table-query`;

  static get observedAttributes() {
    return ['disabled', 'page', 'limit', 'order'];
  }

  query: Query;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.query = {};
    document.addEventListener(PersonsTable.EVENT_QUERY, (evt) => {
      this.query = (evt as CustomEvent).detail;
    });
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
    if (!this.query.columns || this.query.columns.length <= 0) return;
    const table = elem('table');
    this.shadowRoot?.appendChild(table);
  }

  update(): void {
  }
}

customElements.define(PersonsTable.NAME, PersonsTable);

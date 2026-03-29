import { Person } from '../types.ts';
import { elem, getAttrs, NAMESPACE, queryGroups, setAttrs } from '../utils.ts';
import './persons-table.css';

export type ColumnTypes =
  | 'id'
  | 'name'
  | 'birth-date'
  | 'age'
  | 'hometown'
  | 'zodiac';

export interface Query {
  groupIds?: string[];
  personIds?: string[];
  page?: number;
  limit?: number;
  order?: string[];
}

export class PersonsTable extends HTMLElement {
  static NAME = `${NAMESPACE}--persons-table`;
  static EVENT_QUERY = `${NAMESPACE}--persons-table-query`;
  static DEFAULT_COLUMNS = ['id', 'name'];

  static get observedAttributes() {
    return ['disabled', 'page', 'limit', 'order'];
  }

  query: Query;
  rows: Person[];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    setAttrs(
      this,
      'columns',
      getAttrs(this, 'columns'),
      PersonsTable.DEFAULT_COLUMNS,
    );
    this.query = {};
    this.rows = [];
    document.addEventListener(PersonsTable.EVENT_QUERY, (evt) => {
      this.query = (evt as CustomEvent).detail;
    });
  }

  async connectedCallback() {
    this.init();
  }

  async attributeChangedCallback(
    name: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    switch (name) {
      case 'disabled':
        await this.update();
        break;
    }
  }

  async renderTable() {
    // ヘッダー
    const theadRow = elem('tr');
    getAttrs(this, 'columns', PersonsTable.DEFAULT_COLUMNS).forEach(
      (column) => {
        const txt = elem('span', null, column, { labelText: column });
        const th = elem('th');
        th.appendChild(txt);
        theadRow.appendChild(th);
      },
    );
    const thead = elem('thead');
    thead.appendChild(theadRow);

    // レコード
    const tbody = elem('tbody');
    const records = await queryGroups();

    const table = elem('table', ['persons-table']);
    table.appendChild(thead);
    table.appendChild(tbody);
    this.shadowRoot?.appendChild(table);
  }

  async init(): Promise<void> {
    await this.renderTable();
  }

  async update(): Promise<void> {
    await this.renderTable();
  }
}

customElements.define(PersonsTable.NAME, PersonsTable);

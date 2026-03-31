import type { Person } from '../types.ts';
import {
  elem,
  getAttrs,
  ns,
  queryGroups,
  queryPersons,
  renderAge,
  renderDate,
  renderGroupName,
  renderLocation,
  renderPersonName,
  setAttrs,
  zodiac,
} from '../utils.ts';
import HasLabel from './has-label.ts';
import Toolbar from './toolbar.ts';

export type ColumnTypes =
  | 'id'
  | 'name'
  | 'birth-date'
  | 'age'
  | 'hometown'
  | 'zodiac';

const COLUMN_LABELS = {
  'id': 'nouns.id',
  'name': 'nouns.person_name',
  'birth-date': 'nouns.birth_date',
  'age': 'nouns.age',
  'hometown': 'nouns.hometown',
  'zodiac': 'nouns.zodiac',
};

export interface Query {
  groupIds?: string[];
  personIds?: string[];
  page?: number;
  limit?: number;
  order?: string[];
}

export class PersonsList extends HasLabel {
  static NAME = ns('persons-list');
  static EVENT_QUERY = ns('persons-list-query');
  static DEFAULT_COLUMNS = ['id', 'name'];

  static get observedAttributes() {
    return ['disabled', 'page', 'limit', 'order', 'date'];
  }

  query: Query;
  rows: Person[];
  date: Temporal.PlainDate;

  constructor() {
    super();
    const sheet = new CSSStyleSheet();
    sheet.insertRule(`
      :host {
        display: block;
        background: #ddd;
        padding: 10px;
      }
      `);
    sheet.insertRule(`
      td.person-id,
      td.person-birth-date,
      td.person-age,
      td.person-next-birthday {
        text-align: right;
      }
      `);
    this.shadowRoot!.adoptedStyleSheets.push(sheet);
    setAttrs(
      this,
      'columns',
      getAttrs(this, 'columns'),
      PersonsList.DEFAULT_COLUMNS,
    );
    this.query = {};
    this.rows = [];
    this.date = Temporal.Now.plainDateISO();
    document.addEventListener(PersonsList.EVENT_QUERY, (evt) => {
      this.query = (evt as CustomEvent).detail;
    });
    document.addEventListener(Toolbar.EVENT_DATE_CHANGED, (evt) => {
      if ((evt as CustomEvent).detail?.date) {
        this.date = Temporal.PlainDate.from(
          (evt as CustomEvent).detail?.date as string,
        );
      }
    });
  }

  async connectedCallback() {
    await this.init();
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

  async renderFilter() {
    const filterBox = elem('div');
    const groupsSelect = elem('select') as HTMLSelectElement;
    groupsSelect.name = ns('filter-groups');
    const groups = await queryGroups({
      filters: [],
    });
    groups.records.forEach((group) => {
      const opt = elem('option') as HTMLOptionElement;
      opt.value = group.id;
      opt.textContent = renderGroupName(group) || '';
      groupsSelect.appendChild(opt);
    });
    filterBox.appendChild(groupsSelect);
    this.shadowRoot?.appendChild(filterBox);
  }

  async renderList() {
    // ヘッダー
    const theadRow = elem('tr');
    const cols = getAttrs(
      this,
      'columns',
      PersonsList.DEFAULT_COLUMNS,
    ) as ColumnTypes[];
    cols.forEach(
      (col) => {
        const txt = elem('span', null, col, { labelText: COLUMN_LABELS[col] });
        const th = elem('th');
        th.appendChild(txt);
        theadRow.appendChild(th);
      },
    );
    const thead = elem('thead');
    thead.appendChild(theadRow);

    // レコード
    const tbody = elem('tbody');
    const persons = await queryPersons();

    for (const person of persons.records) {
      const tr = elem('tr');
      const cells = cols.map(
        (col) => {
          const td = elem('td', [`person-${col}`]);
          switch (col) {
            case 'id':
              td.textContent = person.id;
              break;
            case 'name':
              td.textContent = renderPersonName(person, this.date) || '';
              break;
            case 'birth-date':
              td.textContent = person.birth_date
                ? renderDate(new Date(person.birth_date))
                : '';
              break;
            case 'age':
              td.textContent = person.birth_date
                ? renderAge(Temporal.PlainDate.from(person.birth_date))
                : '';
              break;
            case 'hometown':
              td.textContent = renderLocation(person);
              break;
            case 'zodiac':
              if (person.birth_date) {
                const thisZodiac = zodiac(
                  Temporal.PlainDate.from(person.birth_date),
                );
                if (thisZodiac) {
                  const span = elem(
                    'span',
                    null,
                    null,
                    {
                      labelText: `zodiacs.${thisZodiac}`,
                    },
                  );
                  td.appendChild(span);
                } else {
                  td.textContent = '';
                }
              } else {
                td.textContent = '';
              }
              break;
            default:
          }
          return td;
        },
      );
      cells.forEach((td) => tr.appendChild(td));
      tbody.append(tr);
    }

    const table = elem('table', ['persons-table']);
    table.appendChild(thead);
    table.appendChild(tbody);
    this.shadowRoot?.appendChild(table);
  }

  async init(): Promise<void> {
    await this.renderFilter();
    await this.renderList();
  }

  async update(): Promise<void> {
    await this.renderFilter();
    await this.renderList();
  }
}

customElements.define(PersonsList.NAME, PersonsList);
export default PersonsList;

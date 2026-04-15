import type { Group, GroupRole, Groups, Person } from '../types.ts';
import {
  elb,
  formatDate,
  getAttrs,
  ns,
  queryGroups,
  queryPersons,
  renderAge,
  renderDateRange,
  renderGroupName,
  renderLocation,
  renderPersonName,
  setAttrs,
  zodiac,
} from '../utils.ts';
import Component from './component.ts';
import Toolbar from './toolbar.ts';

export type ColumnTypes =
  | 'id'
  | 'name'
  | 'birth-date'
  | 'age'
  | 'hometown'
  | 'groups'
  | 'zodiac';

const COLUMN_LABELS: Record<ColumnTypes, string> = {
  'id': 'nouns.id',
  'name': 'nouns.person_name',
  'birth-date': 'nouns.birth_date',
  'age': 'nouns.age',
  'hometown': 'nouns.hometown',
  'groups': 'nouns.groups',
  'zodiac': 'nouns.zodiac',
};

export interface Query {
  page?: number;
  limit?: number;
  order?: string[];
  groupIds?: string[];
  personIds?: string[];
}

export class PersonsList extends Component {
  static NAME = ns('persons-list');
  static EVENT_QUERY = ns('persons-list-query');
  static DEFAULT_COLUMNS = ['id', 'name'];

  static get observedAttributes() {
    return [
      'disabled',
      'page',
      'limit',
      'order',
      'date',
      'group-ids',
    ];
  }

  query: Query;
  date: Temporal.PlainDate;

  constructor() {
    super();
    setAttrs(
      this,
      'columns',
      getAttrs(this, 'columns'),
      PersonsList.DEFAULT_COLUMNS,
    );
    setAttrs(
      this,
      'group-ids',
      getAttrs(this, 'group-ids'),
      [],
    );
    this.query = {};
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
    const groupsSelect = elb('select').attr('name', ns('filter-groups'))
      .elem() as HTMLSelectElement;
    const groups = await queryGroups();
    elb('option').attr('value', '').data('label-text', 'message.unselected')
      .attach(groupsSelect);
    groups.records.forEach((group) => {
      elb('option').attr('value', group.id).txt(renderGroupName(group))
        .attach(groupsSelect);
    });
    elb('div').add(groupsSelect).attach(this.shadow);
  }

  async renderList() {
    // ヘッダー
    const theadRow = elb('tr').elem();
    const cols = getAttrs(
      this,
      'columns',
      PersonsList.DEFAULT_COLUMNS,
    ) as ColumnTypes[];
    cols.forEach(
      (col) => {
        elb('th').add(
          elb('span').txt(col).data('label-text', COLUMN_LABELS[col]).elem(),
        ).attach(theadRow);
      },
    );
    const thead = elb('thead').add(theadRow).elem();

    // レコード
    const [persons, groups] = await Promise.all([
      queryPersons(),
      queryGroups(),
    ]);

    const tbody = elb('tbody').elem();
    for (const person of persons.records) {
      const tr = elb('tr');
      const cells = cols.map(
        (col) => {
          const td = elb('td').cls(`person-${col}`);
          switch (col) {
            case 'id':
              td.txt(person.id);
              break;
            case 'name':
              td.txt(renderPersonName(person, this.date) || '');
              break;
            case 'birth-date':
              td.txt(
                person.birth_date ? formatDate(new Date(person.birth_date)) : '',
              );
              break;
            case 'age':
              td.txt(
                person.birth_date ? renderAge(Temporal.PlainDate.from(person.birth_date)) : '',
              );
              break;
            case 'hometown':
              td.add(elb('span').txt(renderLocation(person)).elem());
              break;
            case 'groups':
              {
                const roles = (person.roles || []).filter((role) => role.role === 'member') as GroupRole[];
                for (const role of roles) {
                  const group = groups.records.find((grp) => grp.id === role.group_id);
                  if (group) {
                    const groupName = renderGroupName(group, this.date);
                    td.add(elb('div').txt(groupName).elem());
                    role.active_date_ranges?.forEach((range) => {
                      td.add(
                        elb('div').txt(renderDateRange(range, this.date, true))
                          .elem(),
                      );
                    });
                  }
                }
              }
              break;
            case 'zodiac':
              if (person.birth_date) {
                const thisZodiac = zodiac(
                  Temporal.PlainDate.from(person.birth_date),
                );
                if (thisZodiac) {
                  td.add(
                    elb('span').data('label-text', `zodiacs.${thisZodiac}`)
                      .elem(),
                  );
                } else {
                  td.txt('');
                }
              } else {
                td.txt('');
              }
              break;
            default:
          }
          return td;
        },
      );
      cells.forEach((td) => tr.add(td.elem()));
      tbody.append(tr.elem());
    }

    elb('table').cls('persons-table').add(thead, tbody).attach(this.shadow);
  }

  async init(): Promise<void> {
    this.insertRule(`
      :host {
        display: block;
        background-color: var(--bg-2-color);
        padding: 10px;
      }
      `);
    this.insertRule(`
      .persons-table {
        width: stretch;
      }
      `);
    this.insertRule(`
      .persons-table td.person-id,
      .persons-table td.person-birth-date,
      .persons-table td.person-age,
      .persons-table td.person-next-birthday,
      .persons-table td.person-zodiac {
        text-align: right;
      }
      `);
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

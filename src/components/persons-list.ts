import type { GroupRole } from '../types.ts';
import { queryGroups, queryGroupTags, queryPersons, queryPersonTags } from '../data.ts';
import {
  clear,
  cssRules,
  el,
  elb,
  getAttrs,
  getNonEmptyAttrs,
  ns,
  renderGroupName,
  renderLocation,
  renderPersonName,
  setAttrs,
} from '../utils.ts';
import { zodiac } from '../zodiac.ts';
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

const SHEET = cssRules(
  ':host { display: block; background-color: var(--bg-2-color); padding: 10px; }',
  '.persons-table { width: stretch; }',
  '.persons-table td.person-id, .persons-table td.person-birth-date, .persons-table td.person-age, .persons-table td.person-next-birthday, .persons-table td.person-zodiac { text-align: right; }',
  '.group-filter { margin-bottom: 8px; }',
  '.group-filter-chips { display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; margin-bottom: 4px; }',
  '.group-filter-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background-color: var(--bg-0-color); border: 1px solid var(--border-color); font-size: 0.85em; }',
  '.group-filter-chip button { border: none; background: none; cursor: pointer; padding: 0 2px; color: var(--text-2-color); font-size: 1em; line-height: 1; }',
  '.group-filter-chip button:hover { color: var(--text-0-color); }',
  '.group-filter-input { width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid var(--border-color); background-color: var(--bg-0-color); color: var(--text-0-color); font-size: 1em; }',
  '.group-filter-list { max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-top: none; background-color: var(--bg-0-color); }',
  '.group-filter-list:empty { display: none; }',
  '.group-filter-list label { display: flex; align-items: center; gap: 6px; padding: 4px 8px; cursor: pointer; }',
  '.group-filter-list label:hover { background-color: var(--bg-1-color); }',
  '.group-filter-list label input[type="checkbox"] { cursor: pointer; }',
);

export class PersonsList extends Component {
  static NAME = ns('persons-list');
  static EVENT_QUERY = ns('persons-list-query');
  static DEFAULT_COLUMNS = ['id', 'name'];

  static register(): void {
    Component.registerComponent(PersonsList.NAME, PersonsList);
  }

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
  selectedGroupIds: Set<string>;

  constructor() {
    super({ css: SHEET });
    setAttrs(
      this,
      'columns',
      getNonEmptyAttrs(this, 'columns'),
      PersonsList.DEFAULT_COLUMNS,
    );
    setAttrs(
      this,
      'group-ids',
      getNonEmptyAttrs(this, 'group-ids'),
      [],
    );
    this.query = {};
    this.date = Temporal.Now.plainDateISO();
    this.selectedGroupIds = new Set(getNonEmptyAttrs(this, 'group-ids'));
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

  addSelectedGroupId(id: string) {
    if (id && id.trim().length > 0) {
      this.selectedGroupIds.add(id);
    }
  }

  removeSelectedGroupId(id: string) {
    if (id && id.trim().length > 0) {
      this.selectedGroupIds.delete(id);
    }
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
      case 'group-ids':
        await this.update();
        break;
    }
  }

  async renderFilter() {
    const groups = await queryGroups();
    const groupList = el('div', { classes: ['group-filter-list'] });
    const filterContainer = el('div', { classes: ['group-filter'] });
    const chipsContainer = el('div', { classes: ['group-filter-chips'] });

    const renderChips = () => {
      clear(chipsContainer);
      this.selectedGroupIds.forEach((id) => {
        const group = groups.records.find((g) => g.id === id);
        if (!group) return;
        const removeBtn = el('button', {
          children: ['×'],
          listeners: {
            'click': () => {
              this.removeSelectedGroupId(id);
              renderOptions((searchInput as HTMLInputElement).value);
              renderChips();
              this.update();
            },
          },
        });
        const chip = el('span', {
          classes: ['group-filter-chip'],
          children: [renderGroupName(group, this.date), removeBtn],
        });
        chipsContainer.appendChild(chip);
      });
    };

    const renderOptions = (filter: string) => {
      clear(groupList);
      const lowerFilter = filter.toLowerCase();
      const matched = groups.records.filter((g) =>
        !filter || renderGroupName(g, this.date).toLowerCase().includes(lowerFilter)
      );
      matched.forEach((group) => {
        const checkbox = el('input', {
          attributes: { 'type': 'checkbox', 'value': group.id },
          listeners: {
            'change': (evt) => {
              if ((evt.target as HTMLInputElement).checked) {
                this.addSelectedGroupId(group.id);
              } else {
                this.removeSelectedGroupId(group.id);
              }
              renderChips();
              this.update();
            },
          },
        }) as HTMLInputElement;
        const nameSpan = el('span', { children: [renderGroupName(group, this.date)] });
        groupList.appendChild(el('label', { children: [checkbox, nameSpan] }));
      });
    };

    const searchInput = el('input', {
      classes: ['group-filter-input'],
      attributes: { 'type': 'text', 'data-label-placeholder': 'message.type_to_filter_groups' },
      listeners: {
        'input': (evt) => {
          renderOptions((evt.target as HTMLInputElement | null)?.value || '');
        },
      },
    });

    renderOptions('');

    filterContainer.append(chipsContainer, searchInput, groupList);
    this.shadow.appendChild(filterContainer);
  }

  async renderList() {
    // ヘッダー
    const theadRow = el('tr');
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
    const [persons, groups, personTags, groupTags] = await Promise.all([
      queryPersons(),
      queryGroups(),
      queryPersonTags(),
      queryGroupTags(),
    ]);

    // Filter persons based on selected groups
    let filteredPersons = persons.records;
    if (this.selectedGroupIds.size > 0) {
      console.log(this.selectedGroupIds);
      filteredPersons = persons.records.filter((person) =>
        person.roles?.some((role) =>
          role.role === 'member' &&
          (role as GroupRole).group_id &&
          this.selectedGroupIds.has((role as GroupRole).group_id)
        )
      );
    }

    const tbody = el('tbody');
    for (const person of filteredPersons) {
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
              td.data('label-date', person.birth_date || '');
              break;
            case 'age':
              td.data('label-age', person.birth_date || '');
              break;
            case 'hometown':
              td.add(elb('span').txt(renderLocation(person)).elem());
              break;
            case 'groups':
              {
                const roles = (person.roles || []).filter((role) =>
                  (role as GroupRole).group_id !== undefined &&
                  (this.selectedGroupIds.size > 0 ? this.selectedGroupIds.has((role as GroupRole).group_id) : true)
                ) as GroupRole[];
                for (const role of roles) {
                  const group = groups.records.find((grp) => grp.id === role.group_id);
                  if (group) {
                    const groupName = renderGroupName(group, this.date);
                    td.add(elb('div').txt(groupName).elem());
                    role.active_date_ranges?.forEach((range) => {
                      td.add(
                        elb('div', {
                          dataset: {
                            'label-date-range-start': range.start || undefined,
                            'label-date-range-end': range.end || undefined,
                            'label-date-range-show-duration': '',
                          },
                        }),
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

    const tbl = this.shadow.querySelector('.persons-table')!;
    clear(tbl).append(thead, tbody);
  }

  async init(): Promise<void> {
    await this.renderFilter();
    elb('table').cls('persons-table').attach(this.shadow);
    await this.renderList();
  }

  async update(): Promise<void> {
    await this.renderList();
  }
}

export default PersonsList;

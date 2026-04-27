import type { Group, GroupRole, Person } from '../types.ts';
import type { ElemBuilder } from '../utils.ts';
import { queryGroups, queryGroupTags, queryPersons, queryPersonTags } from '../data.ts';
import {
  clear,
  cssRules,
  currentPlainDate,
  el,
  elb,
  getNonEmptyAttrs,
  ns,
  parsePlainDate,
  personUrl,
  renderGroupName,
  renderLocation,
  renderPersonName,
  setAttrs,
} from '../utils.ts';
import { zodiac } from '../zodiac.ts';
import Component from './component.ts';
import Multiselect from './multiselect.ts';
import Toolbar from './toolbar.ts';

export type ColumnTypes =
  | 'id'
  | 'name'
  | 'birth-date'
  | 'age'
  | 'hometown'
  | 'groups'
  | 'roles'
  | 'tags'
  | 'zodiac';

const COLUMN_LABELS: Record<ColumnTypes, string> = {
  'id': 'nouns.id',
  'name': 'nouns.person_name',
  'birth-date': 'nouns.birth_date',
  'age': 'nouns.age',
  'hometown': 'nouns.hometown',
  'groups': 'nouns.groups',
  'roles': 'nouns.roles',
  'tags': 'nouns.tags',
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
  columns: ColumnTypes[];
  private groupFilter: Multiselect | null = null;

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
    this.date = currentPlainDate();
    this.selectedGroupIds = new Set(getNonEmptyAttrs(this, 'group-ids'));
    this.columns = getNonEmptyAttrs(this, 'columns', PersonsList.DEFAULT_COLUMNS) as ColumnTypes[];
    document.addEventListener(PersonsList.EVENT_QUERY, (evt) => {
      this.query = (evt as CustomEvent).detail;
    });
    document.addEventListener(Toolbar.EVENT_DATE_CHANGED, (evt) => {
      if ((evt as CustomEvent).detail?.date) {
        this.date = parsePlainDate(
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
    _oldValue?: string | null,
    _newValue?: string | null,
  ) {
    let updated = false;
    switch (name) {
      case 'disabled':
        updated = true;
        break;
      case 'columns': {
        const newColumns = getNonEmptyAttrs(this, 'columns', PersonsList.DEFAULT_COLUMNS) as ColumnTypes[];
        if (
          newColumns.length !== this.columns.length ||
          newColumns.some((col, i) => this.columns[i] !== col)
        ) {
          this.columns = newColumns;
          updated = true;
        }
        break;
      }
      case 'group-ids': {
        const newGroupIds = new Set(getNonEmptyAttrs(this, 'group-ids'));
        if (
          newGroupIds.size !== this.selectedGroupIds.size ||
          newGroupIds.difference(this.selectedGroupIds).size > 0
        ) {
          this.selectedGroupIds = newGroupIds;
          this.groupFilter?.setSelectedKeys(this.selectedGroupIds);
          updated = true;
        }
        break;
      }
    }
    if (updated) {
      await this.update();
    }
  }

  async renderFilter() {
    const groups = await queryGroups();

    const ms = document.createElement(Multiselect.NAME) as Multiselect;
    ms.setAttribute('placeholder-key', 'message.type_to_filter_groups');
    ms.setItems(
      groups.records.map((g) => ({
        key: g.id,
        label: renderGroupName(g, this.date),
      })),
    );
    ms.setSelectedKeys(this.selectedGroupIds);
    ms.addEventListener(Multiselect.EVENT_CHANGE, (evt) => {
      const keys = (evt as CustomEvent<{ keys: string[] }>).detail.keys;
      this.selectedGroupIds = new Set(keys);
      void this.update();
    });
    this.groupFilter = ms;
    this.shadow.appendChild(ms);
  }

  private renderRolesCell(
    td: ElemBuilder,
    person: Person,
    groupsById: Map<string, Group>,
  ) {
    const roles = (person.roles || []).filter((role) =>
      (role as GroupRole).group_id !== undefined &&
      (this.selectedGroupIds.size > 0 ? this.selectedGroupIds.has((role as GroupRole).group_id) : true)
    ) as GroupRole[];

    for (const role of roles) {
      const group = groupsById.get(role.group_id);
      if (!group) continue;
      el('div', {
        children: [
          el('span', { children: [renderGroupName(group, this.date)] }),
          ' (',
          el('span', { dataset: { 'label-text': `roles.${(role as GroupRole).role}` } }),
          ')',
        ],
        attach: td,
      });
      role.periods?.forEach((period) => {
        td.add(elb('div', {
          dataset: {
            'label-period-start': period.start || undefined,
            'label-period-end': period.end || undefined,
            'label-period-show-duration': '',
          },
        }));
      });
    }
  }

  private renderCell(
    col: ColumnTypes,
    person: Person,
    groupsById: Map<string, Group>,
  ): ElemBuilder {
    const td = elb('td').cls(`person-${col}`);
    switch (col) {
      case 'id':
        td.add(el('a', { attributes: { href: personUrl(person.id).toString() }, children: [person.id] }));
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
        td.add(elb('span').txt(renderLocation(person)).el());
        break;
      case 'groups':
        // TODO: グループ表示はどうする？
        this.renderRolesCell(td, person, groupsById);
        break;
      case 'roles':
        this.renderRolesCell(td, person, groupsById);
        break;
      case 'tags':
        el('span', { children: [person.tags?.join(', ') || ''], attach: td });
        break;
      case 'zodiac':
        if (person.birth_date) {
          const sign = zodiac(parsePlainDate(person.birth_date));
          td.add(sign ? elb('span').data('label-text', `zodiacs.${sign}`).el() : '');
        }
        break;
    }
    return td;
  }

  async renderList() {
    const [persons, groups, personTags, groupTags] = await Promise.all([
      queryPersons(),
      queryGroups(),
      queryPersonTags(),
      queryGroupTags(),
    ]);
    const groupsById = new Map(groups.records.map((g) => [g.id, g]));

    const personsInGroups = this.selectedGroupIds.size > 0
      ? persons.records.filter((person) =>
        person.roles?.some((role) =>
          (role as GroupRole).group_id &&
          this.selectedGroupIds.has((role as GroupRole).group_id)
        )
      )
      : persons.records;

    const thead = elb('tr', {
      children: this.columns.map((col) => {
        return elb('span', { dataset: { 'label-text': COLUMN_LABELS[col] } }).root('th');
      }),
    }).root('thead');

    const tbody = el('tbody');
    for (const person of personsInGroups) {
      const tr = elb('tr');
      this.columns.forEach((col) => tr.add(this.renderCell(col, person, groupsById).el()));
      tbody.append(tr.el());
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

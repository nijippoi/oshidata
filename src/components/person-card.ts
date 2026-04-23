import type { Group, GroupRole, Person } from '../types.ts';
import { getPerson, queryGroups } from '../data.ts';
import {
  clear,
  countryFlagEmoji,
  cssRules,
  currentPlainDate,
  el,
  elb,
  ns,
  parsePlainDate,
  renderGroupName,
  renderLocation,
  renderPersonName,
} from '../utils.ts';
import { zodiac } from '../zodiac.ts';
import Component from './component.ts';
import Toolbar from './toolbar.ts';

const SHEET = cssRules(
  ':host { display: block; background-color: var(--bg-2-color); padding: 10px; }',
  '.person-card { display: flex; flex-direction: column; gap: 12px; }',
  '.person-card-notice { color: var(--text-1-color); }',
  '.person-card-header { display: flex; flex-direction: row; gap: 10px; align-items: flex-start; }',
  '.person-card-header-image { width: 120px; height: 120px; object-fit: cover; }',
  '.person-card-header-content { display: flex; flex-direction: column; gap: 6px; }',
  '.person-card-header-content-name { font-size: 1.5em; font-weight: bold; }',
  '.person-card-id { font-size: 0.9em; color: var(--text-2-color); }',
  '.person-fields { display: flex; flex-direction: column; gap: 8px; }',
  '.person-field { display: flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }',
  '.person-field > span:first-child { min-width: 5.5em; color: var(--text-2-color); }',
  '.person-groups > div { margin-bottom: 4px; }',
  '.person-tags { display: flex; flex-wrap: wrap; gap: 4px; }',
  '.person-tag { padding: 2px 6px; background: var(--bg-0-color); border: 1px solid var(--border-color); font-size: 0.85em; }',
);

function formatLocationShort(home: { country?: string; state?: string; city?: string }): string {
  let s = '';
  if (home.country) s += countryFlagEmoji(home.country);
  if (home.state) s += ` ${home.state}`;
  if (home.city) s += ` ${home.city}`;
  return s.trim();
}

export class PersonCard extends Component {
  static NAME = ns('person-card');

  static register(): void {
    Component.registerComponent(PersonCard.NAME, PersonCard);
  }

  static get observedAttributes() {
    return ['person-id'];
  }

  date: Temporal.PlainDate;

  constructor() {
    super({ css: SHEET });
    this.date = currentPlainDate();
    document.addEventListener(Toolbar.EVENT_DATE_CHANGED, (evt) => {
      const d = (evt as CustomEvent).detail?.date as string | undefined;
      if (d) {
        this.date = parsePlainDate(d);
        this.render();
      }
    });
  }

  get personId(): string {
    return (this.getAttribute('person-id') || '').trim();
  }

  private renderGroups(
    person: Person,
    groupsById: Map<string, Group>,
  ): HTMLElement {
    const box = el('div', { classes: ['person-groups'] });
    const roles = (person.roles || []).filter(
      (r): r is GroupRole => (r as GroupRole).group_id !== undefined,
    );
    for (const role of roles) {
      const group = groupsById.get(role.group_id);
      if (!group) continue;
      box.appendChild(
        elb('div')
          .txt(`${renderGroupName(group, this.date)} (${(role as GroupRole).role})`)
          .el(),
      );
      for (const period of role.periods || []) {
        const pb = elb('div');
        if (period.start) pb.data('label-period-start', period.start);
        if (period.end) pb.data('label-period-end', period.end);
        if (period.start || period.end) {
          box.appendChild(pb.el());
        }
      }
    }
    if (!box.firstChild) {
      return elb('span').data('label-text', 'message.unselected').el();
    }
    return box;
  }

  private zodiacNode(birth: string | undefined): HTMLElement {
    if (!birth) {
      return elb('span').el();
    }
    const sign = zodiac(parsePlainDate(birth));
    return sign ? elb('span').data('label-text', `zodiacs.${sign}`).el() : elb('span').el();
  }

  async render(): Promise<void> {
    clear(this.shadow);
    const pid = this.personId;
    if (!pid) {
      elb('div').cls('person-card-notice').data('label-text', 'message.missing_person_id').attach(this.shadow);
      Toolbar.fireChangeTitle('人物', '—');
      document.title = '人物 | 推しデータ';
      return;
    }

    const [person, groupPage] = await Promise.all([getPerson(pid), queryGroups()]);
    if (!person) {
      elb('div').cls('person-card-notice').data('label-text', 'message.person_not_found').attach(this.shadow);
      Toolbar.fireChangeTitle('人物', `ID: ${pid}`);
      document.title = `人物 (ID: ${pid}) | 推しデータ`;
      return;
    }

    const groupsById = new Map(groupPage.records.map((g) => [g.id, g] as [string, Group]));
    const name = renderPersonName(person, this.date) || '—';
    const portrait = (person as Person & { portrait_url?: string }).portrait_url;

    Toolbar.fireChangeTitle(name, person.id);
    document.title = `${name} | 推しデータ`;

    const header = elb('div', { classes: ['person-card-header'] });
    if (portrait) {
      header.add(
        elb('img')
          .cls('person-card-header-image')
          .attr('alt', name)
          .attr('src', portrait)
          .el(),
      );
    }
    header.add(
      elb('div', { classes: ['person-card-header-content'] }).add(
        elb('div', { classes: ['person-card-header-content-name'] }).txt(name).el(),
        elb('div', { classes: ['person-card-id'] })
          .add(
            elb('span').data('label-text', 'nouns.id').el(),
            elb('span').txt(' ' + person.id).el(),
          )
          .el(),
      ).el(),
    );

    const root = elb('div', { classes: ['person-card'] });
    root.add(header.el());
    const fields = elb('div', { classes: ['person-fields'] });

    fields.add(
      elb('div', { classes: ['person-field'] }).add(
        elb('span').data('label-text', 'nouns.birth_date').el(),
        person.birth_date
          ? elb('time').data('label-date', person.birth_date).el()
          : elb('span').data('label-text', 'message.unselected').el(),
      ).el(),
    );

    if (person.birth_date) {
      fields.add(
        elb('div', { classes: ['person-field'] }).add(
          elb('span').data('label-text', 'nouns.age').el(),
          elb('span')
            .data('label-age', person.birth_date)
            .data('label-age-base', this.date.toString())
            .el(),
        ).el(),
        elb('div', { classes: ['person-field'] }).add(
          elb('span').data('label-text', 'nouns.zodiac').el(),
          this.zodiacNode(person.birth_date),
        ).el(),
      );
    }

    const home = renderLocation(person);
    if (home) {
      fields.add(
        elb('div', { classes: ['person-field'] }).add(
          elb('span').data('label-text', 'nouns.hometown').el(),
          elb('span').txt(home).el(),
        ).el(),
      );
    }

    if (person.birth_place) {
      const place = formatLocationShort(person.birth_place);
      if (place) {
        fields.add(
          elb('div', { classes: ['person-field'] }).add(
            elb('span').data('label-text', 'nouns.place_of_birth').el(),
            elb('span').txt(place).el(),
          ).el(),
        );
      }
    }

    fields.add(
      elb('div', { classes: ['person-field'] }).add(
        elb('span').data('label-text', 'nouns.groups').el(),
        this.renderGroups(person, groupsById),
      ).el(),
    );

    if (person.tags && person.tags.length > 0) {
      const tagWrap = elb('div', { classes: ['person-tags'] });
      for (const t of person.tags) {
        tagWrap.add(elb('span').cls('person-tag').txt(t).el());
      }
      fields.add(
        elb('div', { classes: ['person-field'] }).add(
          elb('span').data('label-text', 'nouns.tags').el(),
          tagWrap.el(),
        ).el(),
      );
    }

    root.add(fields.el()).attach(this.shadow);
  }

  async connectedCallback() {
    await this.render();
  }

  async attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === 'person-id' && oldValue !== newValue) {
      await this.render();
    }
  }
}

export default PersonCard;

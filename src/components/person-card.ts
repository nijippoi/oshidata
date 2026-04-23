import type { Group, GroupRole, Person } from '../types.ts';
import { getPerson, queryGroups } from '../data.ts';
import {
  clear,
  countryFlagEmoji,
  cssRules,
  currentPlainDate,
  el,
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
      el('div', {
        children: [`${renderGroupName(group, this.date)} (${(role as GroupRole).role})`],
        attach: box,
      });
      for (const period of role.periods || []) {
        el('div', {
          dataset: {
            ...(period.start ? { 'label-period-start': period.start } : {}),
            ...(period.end ? { 'label-period-end': period.end } : {}),
          },
          attach: box,
        });
      }
    }
    if (!box.firstChild) {
      return el('span', { dataset: { 'label-text': 'message.unselected' } });
    }
    return box;
  }

  private zodiacNode(birth: string | undefined): HTMLElement {
    if (!birth) {
      return el('span');
    }
    const sign = zodiac(parsePlainDate(birth));
    return sign ? el('span', { dataset: { 'label-text': `zodiacs.${sign}` } }) : el('span');
  }

  async render(): Promise<void> {
    clear(this.shadow);
    const pid = this.personId;
    if (!pid) {
      this.shadow.appendChild(
        el('div', {
          classes: ['person-card-notice'],
          dataset: { 'label-text': 'message.missing_person_id' },
        }),
      );
      Toolbar.fireChangeTitle('人物', '—');
      document.title = '人物 | 推しデータ';
      return;
    }

    const [person, groupPage] = await Promise.all([getPerson(pid), queryGroups()]);
    if (!person) {
      el('div', {
        classes: ['person-card-notice'],
        dataset: { 'label-text': 'message.person_not_found' },
        attach: this.shadow,
      });
      Toolbar.fireChangeTitle('人物', `ID: ${pid}`);
      document.title = `人物 (ID: ${pid}) | 推しデータ`;
      return;
    }

    const groupsById = new Map(groupPage.records.map((g) => [g.id, g] as [string, Group]));
    const name = renderPersonName(person, this.date) || '—';
    const portrait = (person as Person & { portrait_url?: string }).portrait_url;

    Toolbar.fireChangeTitle(name, person.id);
    document.title = `${name} | 推しデータ`;

    const headerChildren: Node[] = [];
    if (portrait) {
      headerChildren.push(
        el('img', {
          classes: ['person-card-header-image'],
          attributes: { alt: name, src: portrait },
        }),
      );
    }
    headerChildren.push(
      el('div', {
        classes: ['person-card-header-content'],
        children: [el('div', { classes: ['person-card-header-content-name'], children: [name] })],
      }),
    );
    const header = el('div', { classes: ['person-card-header'], children: headerChildren });

    const fieldRows: HTMLElement[] = [
      el('div', {
        classes: ['person-field'],
        children: [
          el('span', { dataset: { 'label-text': 'nouns.id' } }),
          ` ${person.id}`,
        ],
      }),
      el('div', {
        classes: ['person-field'],
        children: [
          el('span', { dataset: { 'label-text': 'nouns.birth_date' } }),
          person.birth_date
            ? el('time', { dataset: { 'label-date': person.birth_date } })
            : el('span', { dataset: { 'label-text': 'message.unselected' } }),
        ],
      }),
    ];

    if (person.birth_date) {
      fieldRows.push(
        el('div', {
          classes: ['person-field'],
          children: [
            el('span', { dataset: { 'label-text': 'nouns.age' } }),
            el('span', {
              dataset: {
                'label-age': person.birth_date,
                'label-age-base': this.date.toString(),
              },
            }),
          ],
        }),
        el('div', {
          classes: ['person-field'],
          children: [
            el('span', { dataset: { 'label-text': 'nouns.zodiac' } }),
            this.zodiacNode(person.birth_date),
          ],
        }),
      );
    }

    const home = renderLocation(person);
    if (home) {
      fieldRows.push(
        el('div', {
          classes: ['person-field'],
          children: [el('span', { dataset: { 'label-text': 'nouns.hometown' } }), home],
        }),
      );
    }

    if (person.birth_place) {
      const place = formatLocationShort(person.birth_place);
      if (place) {
        fieldRows.push(
          el('div', {
            classes: ['person-field'],
            children: [el('span', { dataset: { 'label-text': 'nouns.place_of_birth' } }), place],
          }),
        );
      }
    }

    fieldRows.push(
      el('div', {
        classes: ['person-field'],
        children: [el('span', { dataset: { 'label-text': 'nouns.groups' } }), this.renderGroups(person, groupsById)],
      }),
    );

    if (person.tags && person.tags.length > 0) {
      const tagEls = person.tags.map((t) => el('span', { classes: ['person-tag'], children: [t] }));
      fieldRows.push(
        el('div', {
          classes: ['person-field'],
          children: [
            el('span', { dataset: { 'label-text': 'nouns.tags' } }),
            el('div', { classes: ['person-tags'], children: tagEls }),
          ],
        }),
      );
    }

    el('div', {
      classes: ['person-card'],
      children: [header, el('div', { classes: ['person-fields'], children: fieldRows })],
      attach: this.shadow,
    });
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

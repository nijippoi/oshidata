import { Toolbar } from '../../components/toolbar.ts';
import { label } from '../../label.ts';
import type { Persons } from '../../types.ts';
import {
  byId,
  clear,
  elem,
  nextMonthDay,
  renderAge,
  renderDate,
  renderDayDuration,
  renderPersonName,
  zodiac,
} from '../../utils.ts';
import './index.css';
// NOTE: deno bundle errors on this (all css with url() fails)
// import 'material-symbols-outlined';

let persons: Persons | undefined = undefined;

async function render(): Promise<void> {
  const tmplTable = byId('template-table') as HTMLTemplateElement;
  const tableFrag = document.importNode(tmplTable.content, true);
  const table = tableFrag.querySelector('table') as HTMLTableElement;
  const tmplRow = byId('template-row') as HTMLTemplateElement;
  for (const key in persons) {
    const person = persons[key];
    const rowFrag = document.importNode(tmplRow.content, true);
    const row = rowFrag.querySelector('tr') as HTMLTableRowElement;
    row.dataset.id = person.id;
    row.querySelectorAll('td.person-id').forEach((td) => {
      td.textContent = person.id;
    });
    rowFrag.querySelectorAll('td.person-name').forEach((td) => {
      td.textContent = renderPersonName(person) || '';
    });
    rowFrag.querySelectorAll('td.person-birth-date').forEach((td) => {
      td.textContent = person.birth_date
        ? renderDate(new Date(person.birth_date))
        : '';
    });
    rowFrag.querySelectorAll('td.person-age').forEach((td) => {
      if (!person.birth_date) {
        td.textContent = '';
        return;
      }
      td.textContent = renderAge(Temporal.PlainDate.from(person.birth_date));
    });
    rowFrag.querySelectorAll('td.person-next-birthday').forEach((td) => {
      if (!person.birth_date) {
        td.textContent = '';
        return;
      }
      td.textContent = renderDayDuration(
        Temporal.Now.plainDateISO(),
        nextMonthDay(Temporal.PlainDate.from(person.birth_date)),
      );
    });
    rowFrag.querySelectorAll('td.person-zodiac').forEach(async (td) => {
      if (!person.birth_date) {
        td.textContent = '';
        return;
      }
      const thisZodiac = zodiac(Temporal.PlainDate.from(person.birth_date));
      if (!thisZodiac) {
        td.textContent = '';
        return;
      }
      const span = elem('span', null, await label(`zodiacs.${thisZodiac}`), {
        labelText: `zodiacs.${thisZodiac}`,
      });
      clear(td);
      td.appendChild(span);
    });
    table.querySelector('tbody')?.appendChild(rowFrag);
    // Toolbar.setTitle(undefined, key);
    // find('oshidata--toolbar')?.setAttribute('subtitle', key);
  }
  const namebookTable = byId(
    'namebook-table',
  ) as HTMLDivElement;
  namebookTable.appendChild(table);
}

async function load(): Promise<void> {
  const res = await fetch('../../data/persons.json');
  if (!res.ok) {
    throw new Error(`Response status: ${res.status}`);
  }
  persons = await res.json();
  await render();
}

addEventListener('DOMContentLoaded', async () => {
  // byId('app')?.appendChild(
  //   elem(LangSelector.TAG_NAME),
  // );
  // byId('oshidata--toolbar')?.setAttribute('title', '名簿');
  // byId('oshidata--toolbar')?.setAttribute('subtitle', '未処理');
  // bind(byId('app')!!);
  Toolbar.fireChangeTitle('名簿', '未処理');
  await load();
});

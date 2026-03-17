import type { Persons } from '../../types.ts';
import {
  nextMonthDay,
  renderAge,
  renderDate,
  renderDayDuration,
  renderPersonName,
} from '../../utils.ts';
import './index.css';

let persons: Persons | undefined = undefined;

async function render(): Promise<void> {
  const tmplTable = document.getElementById(
    'template-table',
  ) as HTMLTemplateElement;
  const tableFrag = document.importNode(tmplTable.content, true);
  const table = tableFrag.querySelector('table') as HTMLTableElement;
  const tmplRow = document.getElementById(
    'template-row',
  ) as HTMLTemplateElement;
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
    table.querySelector('tbody')?.appendChild(rowFrag);
  }
  const namebookTable = document.getElementById(
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
  await load();
});

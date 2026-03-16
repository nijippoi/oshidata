import type { Persons } from '../../types.ts';
import {
  renderDate,
  renderPersonName,
  resolvePersonName,
} from '../../utils.ts';

let persons: Persons | undefined = undefined;

async function render(): Promise<void> {
  const app = document.getElementById('app');
  const namebookTable = document.getElementById(
    'namebook-table',
  ) as HTMLDivElement;
  const tmplTable = document.getElementById(
    'template-table',
  ) as HTMLTemplateElement;
  const tmplRow = document.getElementById(
    'template-row',
  ) as HTMLTemplateElement;
  const tableFrag = document.importNode(tmplTable.content, true);
  const table = tableFrag.querySelector('table') as HTMLTableElement;
  table.id = 'namebook-table';
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
      const age = Temporal.Now.plainDateISO().since(
        Temporal.PlainDate.from(person.birth_date),
        {
          largestUnit: 'year',
          smallestUnit: 'month',
        },
      );
      td.textContent = `${age.years}年${age.months}ヶ月`;
    });
    table.querySelector('tbody')?.appendChild(rowFrag);
  }
  namebookTable.appendChild(table);
}

async function load(): Promise<void> {
  const res = await fetch('../../data/persons.json');
  if (!res.ok) {
    throw new Error(`Response status: ${res.status}`);
  }
  persons = await res.json();
  console.log(persons);
  await render();
}

addEventListener('DOMContentLoaded', async () => {
  await load();
});

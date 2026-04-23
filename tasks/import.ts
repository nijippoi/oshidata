import { parse as parseYaml } from '@std/yaml';
import { join } from '@std/path';
import { parseArgs } from '@std/cli/parse-args';
import type { GroupRole, Groups, Person, PersonRole, Persons, Tags } from '../src/types.ts';
import {
  DEFAULT_DATA_DIR,
  DEFAULT_LABELS_DIR,
  DEFAULT_RELEASE,
  DEFAULT_RES_DIR,
  globFilesSync,
  GROUPS_FILE,
  PERSONS_FILE,
  TAGS_FILE,
  writeJson,
} from './utils.ts';
import { existsSync } from '@std/fs';

export async function importData(
  release: boolean = DEFAULT_RELEASE,
  resDir: string = DEFAULT_RES_DIR,
  dataDir: string = DEFAULT_DATA_DIR,
  labelsDir: string = DEFAULT_LABELS_DIR,
): Promise<void> {
  console.log(
    `Importing release=${release} resDir=${resDir} dataDir=${dataDir} labelsDir=${labelsDir}`,
  );
  if (!existsSync(dataDir)) {
    Deno.mkdirSync(dataDir, { recursive: true });
  }
  if (!existsSync(labelsDir)) {
    Deno.mkdirSync(labelsDir, { recursive: true });
  }

  const { groupsData, personsData, labelsData } = loadYamlFiles(resDir);
  writeLabelsJson(labelsDir, labelsData, release);
  const { groups, groupQualifiers } = processGroups(groupsData);
  writeJson(join(dataDir, GROUPS_FILE), groups, release);
  const persons = processPersons(personsData, groups, groupQualifiers);
  writeJson(join(dataDir, PERSONS_FILE), persons, release);
  const groupTags = Array.from(
    new Set(
      Object.entries(groups).map(([key, item]) => item.tags).filter((tags) => tags && tags.length > 0).flat().filter((
        tag,
      ) => tag && tag.length > 0),
    ),
  ).sort() as string[];
  const personTags = Array.from(
    new Set(
      Object.entries(persons).map(([key, item]) => item.tags).filter((tags) => tags && tags.length > 0).flat().filter((
        tag,
      ) => tag && tag.length > 0),
    ),
  ).sort() as string[];
  const tags: Tags = { group: groupTags, person: personTags };
  writeJson(join(dataDir, TAGS_FILE), tags, release);
}

type ReservedIdRange = {
  start_id: number;
  end_id: number;
  file: string;
};

function assertNoOverlappingReservedIdRanges(
  data: any[],
  sourceTypeLabel: string,
): void {
  const ranges: ReservedIdRange[] = data
    .map((d) => {
      const start_id = Number(d.start_id);
      const end_id = Number(d.end_id);
      if (!Number.isFinite(start_id) || !Number.isFinite(end_id)) return undefined;
      return {
        start_id,
        end_id,
        file: d.file ?? '(unknown file)',
      } satisfies ReservedIdRange;
    })
    .filter((r): r is ReservedIdRange => r !== undefined);

  for (const r of ranges) {
    if (r.end_id < r.start_id) {
      throw new Error(
        `${sourceTypeLabel}: invalid reserved id range in ${r.file}: start_id(${r.start_id}) > end_id(${r.end_id})`,
      );
    }
  }

  ranges.sort((a, b) => a.start_id - b.start_id || a.end_id - b.end_id);
  ranges.forEach((r) => {
    console.log(
      `${sourceTypeLabel}: id range [${r.start_id.toFixed(0).padStart(5, ' ')}, ${
        r.end_id.toFixed(0).padStart(5, ' ')
      }]: ${r.file}`,
    );
  });

  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    const curr = ranges[i];
    if (curr.start_id <= prev.end_id) {
      throw new Error(
        `${sourceTypeLabel}: overlapping reserved id ranges:\n` +
          `- ${prev.file}: [${prev.start_id}, ${prev.end_id}]\n` +
          `- ${curr.file}: [${curr.start_id}, ${curr.end_id}]`,
      );
    }
  }
}

/** ラベルJSONを生成 */
function writeLabelsJson(
  labelsDir: string,
  labelsData: any[],
  release: boolean,
): void {
  const labels = new Map<string, Record<string, string>>();
  for (const ld of labelsData) {
    const lang = ld.lang;
    const values = labels.getOrInsert(lang, {});
    for (const key in ld.labels) {
      values[key] = ld.labels[key];
    }
  }
  for (const lang of labels.keys()) {
    writeJson(join(labelsDir, `${lang}.json`), labels.get(lang), release);
  }
}

/** ソースのYAMLファイルを読み込む */
function loadYamlFiles(resDir: string) {
  const groupsData: any[] = [];
  const personsData: any[] = [];
  const labelsData: any[] = [];
  globFilesSync('**/*.{yml,yaml}', resDir).forEach((filePath) => {
    try {
      const data: any = parseYaml(Deno.readTextFileSync(filePath));
      data.file = filePath;
      switch (data.source_type) {
        case 'groups':
          groupsData.push(data);
          break;
        case 'persons':
          personsData.push(data);
          break;
        case 'labels':
          if (!data.lang) {
            console.warn(`Ignored ${filePath}`);
          } else {
            labelsData.push(data);
          }
          break;
        default:
          console.warn(`Ignored ${filePath}`);
      }
    } catch (error) {
      console.error(`Read error ${filePath}:`, error);
    }
  });
  return { groupsData, personsData, labelsData };
}

/** グループデータを生成 */
function processGroups(groupsData: any[]): {
  groups: Groups;
  groupQualifiers: Record<string, number>;
} {
  assertNoOverlappingReservedIdRanges(groupsData, 'groups');
  const groups: Record<string, any> = {};
  const groupQualifiers: Record<string, number> = {};
  const groupParents: Record<string, string> = {};
  const groupParentQualifiers: Record<string, string> = {};
  for (const data of groupsData) {
    let gid = data.start_id;
    for (const item of data.groups) {
      if (item.reserve_id_until) {
        gid = ++item['reserve_id_until'];
        continue;
      }
      const group: any = { id: gid.toString() };
      if (item.names) {
        group.names = structuredClone(item.names);
      } else {
        group.names = [{
          name: item.name,
          ...(item.name_kana && { name_kana: item.name_kana }),
        }];
      }
      if (item.qualifier) {
        if (groupQualifiers[item.qualifier]) {
          console.error(
            `Group qualifier ${item.qualifier} already exists as id ${groupQualifiers[item.qualifier]}`,
          );
        }
        groupQualifiers[item.qualifier] = gid;
      }
      if (item.parent && !item.parent_qualifier) {
        groupParents[gid] = item.parent;
      }
      if (!item.parent && item.parent_qualifier) {
        groupParentQualifiers[gid] = item.parent_qualifier;
      }
      if (item.periods) {
        group.periods = structuredClone(item.periods);
      }
      if (item.tags && item.tags.length > 0) {
        const tags = item.tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        if (tags.length > 0) {
          group.tags = tags;
        }
      }
      groups[gid.toString(10)] = group;
      gid++;
    }
  }
  // Resolve parent groups
  for (const gid in groupParents) {
    const parentName = groupParents[gid];
    const parentIds = new Set<string>();
    for (const pid in groups) {
      for (const name of groups[pid].names) {
        if (parentName === name.name) parentIds.add(pid);
      }
    }
    if (parentIds.size === 1) {
      groups[gid].parent_id = parentIds.values().next().value;
    } else if (parentIds.size === 0) {
      console.error(
        `Group parent ${parentName} not found for ${groups[gid].names[0]}`,
      );
    } else {
      console.error(
        `Group parent ${parentName} has multiple candidates for ${groups[gid].names[0]}. Use parent_qualifier instead.`,
      );
    }
  }
  return { groups, groupQualifiers };
}

/** グループIDと識別子を解決 */
function resolveGroup(
  name: string | undefined,
  qualifier: string | undefined,
  groupQualifiers: Record<string, number>,
  groups: Record<string, any>,
): string | undefined {
  if (qualifier && groupQualifiers[qualifier]) {
    return groupQualifiers[qualifier].toString();
  }
  const ids = new Set<string>();
  for (const gid in groups) {
    for (const gn of groups[gid].names) {
      if (name === gn.name) ids.add(gid);
    }
  }
  if (ids.size === 1) return ids.values().next().value;
  if (ids.size === 0) console.error(`Group ${name} not found`);
  else {console.error(
      `Group ${name} has multiple candidates. Use group_qualifier instead.`,
    );}
  return undefined;
}

/** 人物データを生成 */
function processPersons(
  personsData: any[],
  groups: Record<string, any>,
  groupQualifiers: Record<string, number>,
): Persons {
  assertNoOverlappingReservedIdRanges(personsData, 'persons');
  const persons: Persons = {};
  for (const data of personsData) {
    let pid = data.start_id;
    for (const item of data.persons) {
      if (item.reserve_id_until) {
        pid = ++item['reserve_id_until'];
        continue;
      }
      const person: Person = { id: pid.toString(), names: [] };
      if (item.names) {
        person.names = structuredClone(item.names);
      } else {
        person.names = [{
          ...(item.full_name && { full_name: item.full_name }),
          ...(item.full_name_kana &&
            { full_name_kana: item.full_name_kana }),
          ...(item.family_name && { family_name: item.family_name }),
          ...(item.family_name_kana &&
            { family_name_kana: item.family_name_kana }),
          ...(item.given_name && { given_name: item.given_name }),
          ...(item.given_name_kana &&
            { given_name_kana: item.given_name_kana }),
          ...(item.middle_name && { middle_name: item.middle_name }),
          ...(item.middle_name_kana &&
            { middle_name_kana: item.middle_name_kana }),
        }];
      }
      if (item.birth_date) person.birth_date = item.birth_date;
      if (item.birth_place) {
        person.birth_place = structuredClone(item.birth_place);
      }
      if (item.hometown) person.hometown = structuredClone(item.hometown);
      if (item.roles) {
        person.roles = [];
        for (const role of item.roles) {
          if (!role.role) {
            console.error(`Role is not set on person id ${pid}`);
            continue;
          }
          if (role.group || role.group_qualifier) {
            const gid = resolveGroup(
              role.group,
              role.group_qualifier,
              groupQualifiers,
              groups,
            );
            if (gid) {
              const r: GroupRole = { role: role.role, group_id: gid };
              if (role.periods) {
                r.periods = structuredClone(role.periods);
              }
              person.roles.push(r);
            }
          } else {
            const r: PersonRole = {
              role: role.role,
              person_id: pid.toString(),
            };
            if (role.periods) {
              r.periods = structuredClone(role.periods);
            }
            person.roles.push(r);
          }
        }
        person.roles.sort((l, r) => {
          if (
            l.periods && l.periods.length > 0 && r.periods &&
            r.periods.length > 0
          ) {
            const lStarts = l.periods.map((period) => period.start).filter((date) => date !== undefined)
              .toSorted();
            const rStarts = r.periods.map((period) => period.start).filter((date) => date !== undefined)
              .toSorted();
            if (lStarts.length > 0 && rStarts.length > 0) {
              return lStarts[0].localeCompare(rStarts[0]);
            } else if (lStarts.length > 0) {
              return -1;
            } else if (rStarts.length > 0) {
              return +1;
            }
            return 0;
          } else if (l.periods && l.periods.length > 0) {
            return -1;
          } else if (r.periods && r.periods.length > 0) {
            return +1;
          }
          return 0;
        });
      }
      if (item.tags && item.tags.length > 0) {
        const tags = item.tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        if (tags.length > 0) {
          person.tags = tags;
        }
      }
      persons[pid.toString(10)] = person;
      pid++;
    }
  }
  return persons;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ['resdir', 'datadir', 'labelsdir'],
    boolean: ['release'],
    negatable: ['release'],
    default: {
      release: DEFAULT_RELEASE,
      resdir: DEFAULT_RES_DIR,
      datadir: DEFAULT_DATA_DIR,
      labelsdir: DEFAULT_LABELS_DIR,
    },
  });
  await importData(args.release, args.resdir, args.datadir, args.labelsdir);
}

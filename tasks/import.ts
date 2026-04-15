import { parse as parseYaml } from '@std/yaml';
import { join } from '@std/path';
import { parseArgs } from '@std/cli/parse-args';
import type { GroupRole, Person, PersonRole, Persons } from '../src/types.ts';
import {
  DEFAULT_DATA_DIR,
  DEFAULT_LABELS_DIR,
  DEFAULT_RELEASE,
  DEFAULT_RES_DIR,
  globFilesSync,
  GROUPS_FILE,
  PERSONS_FILE,
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
function processGroups(groupsData: any[]) {
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
      if (item.active_date_ranges) {
        group.active_date_ranges = structuredClone(item.active_date_ranges);
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
              if (role.active_date_ranges) {
                r.active_date_ranges = structuredClone(role.active_date_ranges);
              }
              person.roles.push(r);
            }
          } else {
            const r: PersonRole = {
              role: role.role,
              person_id: pid.toString(),
            };
            if (role.active_date_ranges) {
              r.active_date_ranges = structuredClone(role.active_date_ranges);
            }
            person.roles.push(r);
          }
        }
      }
      if (item.tags && item.tags.length > 0) {
        const tags = item.tags.map((t: string) => t.trim()).filter(Boolean);
        if (tags.length > 0) person.tags = tags;
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

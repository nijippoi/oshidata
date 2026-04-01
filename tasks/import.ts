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
} from './utils.ts';
import { existsSync } from '@std/fs';

export async function importData(
  release: boolean = DEFAULT_RELEASE,
  resDir: string = DEFAULT_RES_DIR,
  dataDir: string = DEFAULT_DATA_DIR,
  labelsDir: string = DEFAULT_LABELS_DIR,
): Promise<void> {
  if (!existsSync(dataDir)) {
    Deno.mkdirSync(dataDir, { recursive: true });
  }
  if (!existsSync(labelsDir)) {
    Deno.mkdirSync(labelsDir, { recursive: true });
  }

  // dirPath内のYAMLを読み込む
  // deno-lint-ignore no-explicit-any
  const allGroupsData: any[] = [];
  // deno-lint-ignore no-explicit-any
  const allPersonsData: any[] = [];
  // deno-lint-ignore no-explicit-any
  const allLabelsData: any[] = [];
  globFilesSync('**/*.{yml,yaml}', resDir).forEach(
    (filePath) => {
      try {
        const data: any = parseYaml(Deno.readTextFileSync(filePath));
        data.file = filePath;
        switch (data.source_type) {
          case 'groups':
            allGroupsData.push(data);
            break;
          case 'persons':
            allPersonsData.push(data);
            break;
          case 'labels':
            if (!data.lang) {
              console.warn(`Ignored ${filePath}`);
            } else {
              allLabelsData.push(data);
            }
            break;
          default:
            console.warn(`Ignored ${filePath}`);
        }
      } catch (error) {
        console.error(`Read error ${filePath}:`, error);
      }
    },
  );

  // ラベルデータを作成
  const labels = new Map<string, { [keyof: string]: string }>();
  for (const labelsData of allLabelsData) {
    const lang: string = labelsData.lang;
    const values = labels.getOrInsert(lang, {});
    for (const key in labelsData.labels) {
      values[key] = labelsData.labels[key];
    }
  }

  for (const lang of labels.keys()) {
    Deno.writeTextFileSync(
      join(labelsDir, `${lang}.json`),
      release === true
        ? JSON.stringify(labels.get(lang))
        : JSON.stringify(labels.get(lang), null, 2),
    );
  }

  // TODO: ID重複チェック

  const groups: { [key: string]: any } = {};
  const groupQualifiers: { [key: string]: number } = {};
  const groupParents: { [key: string]: string } = {};
  const groupParentQualifiers: { [key: string]: string } = {};

  // グループにIDを付与
  for (const groupsData of allGroupsData) {
    let groupId = groupsData.start_id;
    for (const groupData of groupsData.groups) {
      if (groupData.reserve_id_until) {
        groupId = ++groupData['reserve_id_until'];
        continue;
      }

      let group: any = {
        id: groupId.toString(),
      };

      // グループ名を正規化
      if (groupData.names) {
        group.names = structuredClone(groupData.names);
      } else {
        group.names = [{
          name: groupData.name,
          ...(groupData.name_kana && { name_kana: groupData.name_kana }),
        }];
      }
      if (groupData.qualifier) {
        if (groupQualifiers[groupData.qualifier]) {
          console.error(
            `Group qualifier ${groupData.qualifier} already exists as id ${
              groupQualifiers[groupData.qualifier]
            }`,
          );
        }
        groupQualifiers[groupData.qualifier] = groupId;
      }
      if (groupData.parent && !groupData.parent_qualifier) {
        groupParents[groupId] = groupData.parent;
      }
      if (!groupData.parent && groupData.parent_qualifier) {
        groupParentQualifiers[groupId] = groupData.parent_qualifier;
      }
      if (groupData.active_date_ranges) {
        group.active_date_ranges = structuredClone(
          groupData.active_date_ranges,
        );
      }

      groups[groupId.toString(10)] = group;
      groupId++;
    }
  }
  // 親グループを解決
  for (const groupId in groupParents) {
    const parentName = groupParents[groupId];
    const parentIds: Set<string> = new Set();
    for (const parentId in groups) {
      for (const name of groups[parentId].names) {
        if (parentName == name.name) parentIds.add(parentId);
      }
    }
    if (parentIds.size === 1) {
      groups[groupId].parent_id = parentIds.values().next().value;
    } else if (parentIds.size === 0) {
      console.error(
        `Group parent ${parentName} not found for ${groups[groupId].names[0]}`,
      );
    } else {
      console.error(
        `Group parent ${parentName} has multiple candidates for ${
          groups[groupId].names[0]
        }. Use parent_qualifier instead.`,
      );
    }
  }

  Deno.writeTextFileSync(
    join(dataDir, GROUPS_FILE),
    release === true ? JSON.stringify(groups) : JSON.stringify(groups, null, 2),
  );

  const resolveGroup = (
    name?: string,
    qualifier?: string,
  ): string | undefined => {
    if (qualifier && groupQualifiers[qualifier]) {
      return groupQualifiers[qualifier].toString();
    }
    const groupIds: Set<string> = new Set();
    for (const groupId in groups) {
      for (const groupName of groups[groupId].names) {
        if (name == groupName.name) groupIds.add(groupId);
      }
    }
    if (groupIds.size === 1) {
      return groupIds.values().next().value;
    } else if (groupIds.size === 0) {
      console.error(
        `Group ${name} not found`,
      );
    } else {
      console.error(
        `Group ${name} has multiple candidates. Use group_qualifier instead.`,
      );
    }
    return undefined;
  };

  const persons: Persons = {};

  // 人物にIDを付与
  for (const datas of allPersonsData) {
    let id = datas.start_id;
    for (const data of datas.persons) {
      if (data.reserve_id_until) {
        id = ++data['reserve_id_until'];
        continue;
      }

      const person: Person = { id: id.toString(), names: [] };

      // 人名正規化
      if (data.names) {
        person.names = structuredClone(data.names);
      } else {
        person.names = [{
          ...(data.full_name && { full_name: data.full_name }),
          ...(data.full_name_kana &&
            { full_name_kana: data.full_name_kana }),
          ...(data.family_name && { family_name: data.family_name }),
          ...(data.family_name_kana &&
            { family_name_kana: data.family_name_kana }),
          ...(data.given_name && { given_name: data.given_name }),
          ...(data.given_name_kana &&
            { given_name_kana: data.given_name_kana }),
          ...(data.middle_name && { middle_name: data.middle_name }),
          ...(data.middle_name_kana &&
            { middle_name_kana: data.middle_name_kana }),
        }];
      }
      if (data.birth_date) {
        person.birth_date = data.birth_date;
      }
      if (data.birth_place) {
        person.birth_place = structuredClone(data.birth_place);
      }
      if (data.hometown) {
        person.hometown = structuredClone(data.hometown);
      }
      if (data.roles) {
        person.roles = [];
        for (const roleData of data.roles) {
          if (!roleData.role) {
            console.error(`Role is not set on person id ${id}`);
            continue;
          }
          if (roleData.group || roleData.group_qualifier) {
            const groupId = resolveGroup(
              roleData.group,
              roleData.group_qualifier,
            );
            if (groupId) {
              const role: GroupRole = {
                role: roleData.role,
                group_id: groupId,
              };
              if (roleData.active_date_ranges) {
                role.active_date_ranges = structuredClone(
                  roleData.active_date_ranges,
                );
              }
              person.roles.push(role);
            }
          } else {
            const role: PersonRole = {
              role: roleData.role,
              person_id: id.toString(),
            };
            if (roleData.active_date_ranges) {
              role.active_date_ranges = structuredClone(
                roleData.active_date_ranges,
              );
            }
            person.roles.push(role);
          }
        }
      }

      persons[id.toString(10)] = person;
      id++;
    }
  }
  Deno.writeTextFileSync(
    join(dataDir, PERSONS_FILE),
    release === true
      ? JSON.stringify(persons)
      : JSON.stringify(persons, null, 2),
  );
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

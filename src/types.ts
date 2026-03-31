/**
 * アーティストグループデータベース型定義
 */

/** グループのエンティティのID */
export const GROUP_ENTITY_ID = 1;

/** アーティストのエンティティのID */
export const PERSON_ENTITY_ID = 2;

export type Id = string;

/**
 * ISO 8601形式の文字列 (YYYY-MM-DD)
 */
export type DateString = `${number}${number}${number}${number}-${
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'}-${
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '24'
  | '25'
  | '26'
  | '27'
  | '28'
  | '29'
  | '30'
  | '31'}`;

/**
 * 開始日と終了日を含む期間
 */
export interface DateRange {
  /** 開始日(含む): ISO 8601形式 (YYYY-MM-DD) */
  start?: DateString;
  /** 終了日(含む): ISO 8601形式 (YYYY-MM-DD) */
  end?: DateString;
}

/**
 * 活動期間を持つエンティティのインターフェース
 */
export interface HasActiveDateRanges {
  /** 有効期間の配列 */
  active_date_ranges?: DateRange[];
}

/**
 * 削除フラグを持つエンティティのインターフェース
 */
export interface HasDeleted {
  /** 削除フラグ */
  deleted: true;
}

/**
 * IDを持つエンティティのインターフェース
 */
export interface HasId {
  /** ID */
  id: Id;
}

/**
 * 都道府県などの地域情報
 */
export interface Location {
  /** ISO 3166-1 alpha-2国コード */
  country?: string;
  /** 国内の最上位の行政区域に当たるもの。例えば日本だと都道府県名になる。 */
  state?: string;
  /** オプショナルな市区町村名 */
  city?: string;
}

/**
 * グループ名のバリエーション（期間指定可能）
 */
export interface GroupName {
  /** グループ名 */
  name: string;
  /** グループ名のカタカナ読み */
  name_kana?: string;
}

/**
 * グループ定義（メイングループまたはサブグループ）
 */
export interface Group extends HasId, HasActiveDateRanges {
  /** グループ名の配列 */
  names: (GroupName & HasActiveDateRanges)[];
  /** サブグループの親グループ名 */
  parent_id?: Id;
}

/**
 * グループ一覧
 */
export interface Groups {
  [key: Id]: Group;
}

/**
 * 役職のタイプ
 */
export type RoleTypes =
  | 'solo'
  | 'member'
  | 'trainee'
  | 'leader'
  | 'subleader'
  | 'vocal'
  | 'dancer'
  | 'producer'
  | 'drummer'
  | 'guitarist'
  | 'keyboardist';

/**
 * 共通のロール情報
 */
export interface BaseRole extends HasActiveDateRanges {
  /** 役割のタイプ */
  role: RoleTypes;
}

/**
 * グループロール（グループに関連する役職）
 */
export interface GroupRole extends BaseRole {
  /** グループID */
  group_id: Id;
}

/**
 * アーティストロール（アーティストに関連する役職）
 */
export interface PersonRole extends BaseRole {
  /** アーティストID */
  person_id: Id;
}

/**
 * 役割と活動期間（グループまたはアーティストいずれか一方に関連）
 */
export type Role = GroupRole | PersonRole;

/**
 * 役職定義（利用可能な役職についてのメタデータ）
 */
export interface RoleType {
  /** 役職の表示名 */
  name: string;
}

/**
 * 人名（期間指定可能）
 */
export interface PersonName {
  /** フルネーム */
  name?: string;
  /** フルネームのカタカナ読み */
  name_kana?: string;
  /** 苗字（漢字） */
  family_name?: string;
  /** 苗字（カタカナ） */
  family_name_kana?: string;
  /** 下の名前（漢字、または苗字がない場合は名前） */
  given_name: string;
  /** 下の名前（カタカナ） */
  given_name_kana: string;
  /** ミドルネーム（漢字） */
  middle_name?: string;
  /** ミドルネーム（カタカナ） */
  middle_name_kana?: string;
}

/**
 * 人物情報
 */
export interface Person extends HasId, HasActiveDateRanges {
  /** 名前のバリエーション（期間指定可能） */
  names: (PersonName & HasActiveDateRanges)[];
  /** 生年月日（ISO 8601形式: YYYY-MM-DD） */
  birth_date?: DateString;
  /** 出生地 */
  birth_place?: Location;
  /** 故郷 */
  hometown?: Location;
  /** 役割の配列 */
  roles?: Role[];
}

/**
 * 人物一覧
 */
export interface Persons {
  [key: Id]: Person;
}

export enum Entities {
  Persons = 'persons',
  Groups = 'groups',
}

export enum OrderDirections {
  Asc = 'asc',
  Desc = 'desc',
}

export interface QueryOrder {
  field: string;
  direction?: OrderDirections;
}

export type Predicate<T> = (record: T) => boolean;

export interface Query<T> {
  filters?: Predicate<T>[];
  page?: number;
  limit?: number;
  orders?: QueryOrder[];
}

export interface Paged<T> {
  records: T[];
  page?: number;
  next_page?: number;
}

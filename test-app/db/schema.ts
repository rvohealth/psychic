import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = ColumnType<JsonValue, string | JsonValue, string | JsonValue>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Numeric = ColumnType<string, number | string, number | string>;

export type SpeciesTypesEnum = "cat" | "noncat";
export const SpeciesTypesEnumValues = [
  "cat",
  "noncat"
] as const

type IdType = string | number | bigint | undefined
type Timestamp = ColumnType<DateTime>

export interface HealthUsers {
  createdAt: Timestamp;
  email: string | null;
  id: Generated<number>;
  name: string | null;
  passwordDigest: string | null;
  updatedAt: Timestamp;
}

export interface Pets {
  collarCount: Int8 | null;
  collarCountInt: number | null;
  collarCountNumeric: Numeric | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  lastHeardAt: Generated<Timestamp>;
  lastSeenAt: Timestamp | null;
  likesTreats: Generated<boolean>;
  likesWalks: boolean | null;
  name: string | null;
  requiredCollarCount: Generated<Int8>;
  requiredCollarCountInt: Generated<number>;
  requiredCollarCountNumeric: Generated<number>;
  species: SpeciesTypesEnum | null;
  updatedAt: Timestamp;
  userId: number;
}

export interface Users {
  bio: Generated<string>;
  birthdate: Timestamp | null;
  createdAt: Generated<Timestamp>;
  createdOn: Generated<Timestamp>;
  email: string;
  favoriteBigints: Int8[] | null;
  favoriteBooleans: boolean[] | null;
  favoriteDates: Timestamp[] | null;
  favoriteDatetimes: Timestamp[] | null;
  favoriteIntegers: number[] | null;
  favoriteJsonbs: Json[] | null;
  favoriteJsons: Json[] | null;
  favoriteNumerics: Numeric[] | null;
  favoriteTexts: string[] | null;
  favoriteUuids: string[] | null;
  id: Generated<number>;
  jsonData: Json | null;
  jsonbData: Json | null;
  name: string | null;
  nicknames: string[] | null;
  notes: string | null;
  optionalUuid: Generated<string | null>;
  passwordDigest: string;
  requiredFavoriteBigints: Generated<Int8[]>;
  requiredFavoriteBooleans: Generated<boolean[]>;
  requiredFavoriteDates: Generated<Timestamp[]>;
  requiredFavoriteDatetimes: Generated<Timestamp[]>;
  requiredFavoriteIntegers: Generated<number[]>;
  requiredFavoriteJsonbs: Generated<Json[]>;
  requiredFavoriteJsons: Generated<Json[]>;
  requiredFavoriteNumerics: Generated<Numeric[]>;
  requiredFavoriteTexts: Generated<string[]>;
  requiredFavoriteUuids: Generated<string[]>;
  requiredJsonData: Generated<Json>;
  requiredJsonbData: Generated<Json>;
  requiredNicknames: Generated<string[]>;
  updatedAt: Generated<Timestamp>;
  uuid: Generated<string>;
}

export interface DB {
  health_users: HealthUsers;
  pets: Pets;
  users: Users;
}


export const AllColumns = ['bio', 'birthdate', 'collarCount', 'collarCountInt', 'collarCountNumeric', 'createdAt', 'createdOn', 'email', 'favoriteBigints', 'favoriteBooleans', 'favoriteDates', 'favoriteDatetimes', 'favoriteIntegers', 'favoriteJsonbs', 'favoriteJsons', 'favoriteNumerics', 'favoriteTexts', 'favoriteUuids', 'healthUsers', 'id', 'jsonData', 'jsonbData', 'lastHeardAt', 'lastSeenAt', 'likesTreats', 'likesWalks', 'name', 'nicknames', 'notes', 'optionalUuid', 'passwordDigest', 'pets', 'requiredCollarCount', 'requiredCollarCountInt', 'requiredCollarCountNumeric', 'requiredFavoriteBigints', 'requiredFavoriteBooleans', 'requiredFavoriteDates', 'requiredFavoriteDatetimes', 'requiredFavoriteIntegers', 'requiredFavoriteJsonbs', 'requiredFavoriteJsons', 'requiredFavoriteNumerics', 'requiredFavoriteTexts', 'requiredFavoriteUuids', 'requiredJsonData', 'requiredJsonbData', 'requiredNicknames', 'species', 'updatedAt', 'userId', 'users', 'uuid'] as const

export class DBClass {
  health_users: HealthUsers
  pets: Pets
  users: Users
}

export const schema = {
  health_users: {
    columns: {
      id: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      email: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      passwordDigest: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      
    },
  },
  pets: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      collarCount: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      collarCountInt: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      collarCountNumeric: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'numeric',
        allowNull: true,
        isArray: false,
      },
      requiredCollarCount: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      requiredCollarCountInt: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      requiredCollarCountNumeric: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      likesWalks: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      likesTreats: {
        coercedType: {} as boolean,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: false,
        isArray: false,
      },
      species: {
        coercedType: {} as SpeciesTypesEnum | null,
        enumType: {} as SpeciesTypesEnum,
        enumValues: SpeciesTypesEnumValues,
        dbType: 'species_types_enum',
        allowNull: true,
        isArray: false,
      },
      lastSeenAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: true,
        isArray: false,
      },
      lastHeardAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        foreignKey: 'userId',
        tables: ['users'],
        optional: false,
      },
    },
  },
  users: {
    columns: {
      id: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      nicknames: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying[]',
        allowNull: true,
        isArray: true,
      },
      requiredNicknames: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'character varying[]',
        allowNull: false,
        isArray: true,
      },
      email: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      notes: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      birthdate: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'date',
        allowNull: true,
        isArray: false,
      },
      favoriteUuids: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'uuid[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteUuids: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'uuid[]',
        allowNull: false,
        isArray: true,
      },
      favoriteDates: {
        coercedType: {} as Timestamp[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'date[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteDates: {
        coercedType: {} as Timestamp[],
        enumType: null,
        enumValues: null,
        dbType: 'date[]',
        allowNull: false,
        isArray: true,
      },
      favoriteDatetimes: {
        coercedType: {} as Timestamp[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteDatetimes: {
        coercedType: {} as Timestamp[],
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone[]',
        allowNull: false,
        isArray: true,
      },
      favoriteJsons: {
        coercedType: {} as Json[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'json[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteJsons: {
        coercedType: {} as Json[],
        enumType: null,
        enumValues: null,
        dbType: 'json[]',
        allowNull: false,
        isArray: true,
      },
      favoriteJsonbs: {
        coercedType: {} as Json[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteJsonbs: {
        coercedType: {} as Json[],
        enumType: null,
        enumValues: null,
        dbType: 'jsonb[]',
        allowNull: false,
        isArray: true,
      },
      favoriteTexts: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'text[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteTexts: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'text[]',
        allowNull: false,
        isArray: true,
      },
      favoriteNumerics: {
        coercedType: {} as Numeric[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'numeric[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteNumerics: {
        coercedType: {} as Numeric[],
        enumType: null,
        enumValues: null,
        dbType: 'numeric[]',
        allowNull: false,
        isArray: true,
      },
      favoriteBooleans: {
        coercedType: {} as boolean[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteBooleans: {
        coercedType: {} as boolean[],
        enumType: null,
        enumValues: null,
        dbType: 'boolean[]',
        allowNull: false,
        isArray: true,
      },
      favoriteBigints: {
        coercedType: {} as Int8[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteBigints: {
        coercedType: {} as Int8[],
        enumType: null,
        enumValues: null,
        dbType: 'bigint[]',
        allowNull: false,
        isArray: true,
      },
      favoriteIntegers: {
        coercedType: {} as number[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer[]',
        allowNull: true,
        isArray: true,
      },
      requiredFavoriteIntegers: {
        coercedType: {} as number[],
        enumType: null,
        enumValues: null,
        dbType: 'integer[]',
        allowNull: false,
        isArray: true,
      },
      createdOn: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'date',
        allowNull: false,
        isArray: false,
      },
      optionalUuid: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'uuid',
        allowNull: true,
        isArray: false,
      },
      uuid: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'uuid',
        allowNull: false,
        isArray: false,
      },
      bio: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: false,
        isArray: false,
      },
      jsonbData: {
        coercedType: {} as Json | null,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb',
        allowNull: true,
        isArray: false,
      },
      requiredJsonbData: {
        coercedType: {} as Json,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb',
        allowNull: false,
        isArray: false,
      },
      jsonData: {
        coercedType: {} as Json | null,
        enumType: null,
        enumValues: null,
        dbType: 'json',
        allowNull: true,
        isArray: false,
      },
      requiredJsonData: {
        coercedType: {} as Json,
        enumType: null,
        enumValues: null,
        dbType: 'json',
        allowNull: false,
        isArray: false,
      },
      passwordDigest: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: ['password'],
    associations: {
      pets: {
        type: 'HasMany',
        foreignKey: null,
        tables: ['pets'],
        optional: null,
      },
    },
  },
} as const

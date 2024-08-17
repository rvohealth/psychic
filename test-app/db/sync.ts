import { CalendarDate } from '@rvohealth/dream'
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

export type PetTreatsEnum = "efishy feesh" | "snick snowcks";
export const PetTreatsEnumValues = [
  "efishy feesh",
  "snick snowcks"
] as const


export type SpeciesTypesEnum = "cat" | "noncat";
export const SpeciesTypesEnumValues = [
  "cat",
  "noncat"
] as const

export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>

export interface Comments {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  postId: Int8;
  updatedAt: Timestamp;
}

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
  favoriteTreats: PetTreatsEnum[] | null;
  id: Generated<Int8>;
  lastHeardAt: Generated<Timestamp>;
  lastSeenAt: Timestamp | null;
  likesTreats: Generated<boolean>;
  likesWalks: boolean | null;
  name: string | null;
  requiredCollarCount: Generated<Int8>;
  requiredCollarCountInt: Generated<number>;
  requiredCollarCountNumeric: Generated<Numeric>;
  species: SpeciesTypesEnum | null;
  updatedAt: Timestamp;
  userId: number;
}

export interface Posts {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface Users {
  bio: Generated<string>;
  birthdate: Timestamp | null;
  createdAt: Generated<Timestamp>;
  createdOn: Generated<Timestamp>;
  email: string;
  favoriteBigint: Int8 | null;
  favoriteBigints: Int8[] | null;
  favoriteBooleans: boolean[] | null;
  favoriteCitext: string | null;
  favoriteCitexts: string[] | null;
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
  requiredFavoriteBigint: Generated<Int8>;
  requiredFavoriteBigints: Generated<Int8[]>;
  requiredFavoriteBooleans: Generated<boolean[]>;
  requiredFavoriteCitext: Generated<string>;
  requiredFavoriteCitexts: Generated<string[]>;
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
  comments: Comments;
  health_users: HealthUsers;
  pets: Pets;
  posts: Posts;
  users: Users;
}


export class DBClass {
  comments: Comments
  health_users: HealthUsers
  pets: Pets
  posts: Posts
  users: Users
}

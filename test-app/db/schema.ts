
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type SpeciesTypesEnum = "cat" | "noncat";

export type Timestamp = ColumnType<DateTime>
export type IdType = string | number | bigint | undefined;

export interface HealthUsers {
  id: Generated<number>;
  email: string | null;
  password_digest: string | null;
  name: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Pets {
  id: Generated<Int8>;
  user_id: number;
  name: string | null;
  species: SpeciesTypesEnum | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  email: string;
  password_digest: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface DB {
  health_users: HealthUsers;
  pets: Pets;
  users: Users;
}



export const HealthUserColumns = ['id', 'email', 'password_digest', 'name', 'created_at', 'updated_at']
export const PetColumns = ['id', 'user_id', 'name', 'species', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at']

export interface HealthUserAttributes {
  id: number
  email: string | null
  password_digest: string | null
  name: string | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface PetAttributes {
  id: IdType
  user_id: number
  name: string | null
  species: SpeciesTypesEnum | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface UserAttributes {
  id: number
  name: string | null
  email: string
  password_digest: string
  created_at: DateTime
  updated_at: DateTime
}  


export const HealthUsersTypeCache = {
  id: 'Generated<number>',
  email: 'string|null',
  password_digest: 'string|null',
  name: 'string|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const PetsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'number',
  name: 'string|null',
  species: 'SpeciesTypesEnum|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const UsersTypeCache = {
  id: 'Generated<number>',
  name: 'string|null',
  email: 'string',
  password_digest: 'string',
  created_at: 'Generated<Timestamp>',
  updated_at: 'Generated<Timestamp>'
}  



export const DBColumns = {
  health_users: HealthUserColumns,
  pets: PetColumns,
  users: UserColumns
}

export const DBTypeCache = {
  health_users: HealthUsersTypeCache,
  pets: PetsTypeCache,
  users: UsersTypeCache
}

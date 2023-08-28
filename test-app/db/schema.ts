import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type SpeciesTypesEnum = "cat" | "noncat";
export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime>

export interface HealthUsers {
  id: Generated<number>;
  email: string | null;
  passwordDigest: string | null;
  name: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Pets {
  id: Generated<Int8>;
  userId: number;
  name: string | null;
  species: SpeciesTypesEnum | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  email: string;
  passwordDigest: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface DB {
  health_users: HealthUsers;
  pets: Pets;
  users: Users;
}


export const HealthUserColumns = ['id', 'email', 'passwordDigest', 'name', 'createdAt', 'updatedAt']
export const PetColumns = ['id', 'userId', 'name', 'species', 'createdAt', 'updatedAt']
export const UserColumns = ['id', 'name', 'email', 'passwordDigest', 'createdAt', 'updatedAt']

export interface HealthUserAttributes {
  id: number
  email: string | null
  passwordDigest: string | null
  name: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface PetAttributes {
  id: IdType
  userId: number
  name: string | null
  species: SpeciesTypesEnum | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface UserAttributes {
  id: number
  name: string | null
  email: string
  passwordDigest: string
  createdAt: DateTime
  updatedAt: DateTime
}  


export const HealthUsersTypeCache = {
  id: 'Generated<number>',
  email: 'string|null',
  passwordDigest: 'string|null',
  name: 'string|null',
  createdAt: 'Timestamp',
  updatedAt: 'Timestamp'
}  

export const PetsTypeCache = {
  id: 'Generated<Int8>',
  userId: 'number',
  name: 'string|null',
  species: 'SpeciesTypesEnum|null',
  createdAt: 'Timestamp',
  updatedAt: 'Timestamp'
}  

export const UsersTypeCache = {
  id: 'Generated<number>',
  name: 'string|null',
  email: 'string',
  passwordDigest: 'string',
  createdAt: 'Generated<Timestamp>',
  updatedAt: 'Generated<Timestamp>'
}  



export interface InterpretedDB {
  health_users: HealthUserAttributes,
  pets: PetAttributes,
  users: UserAttributes
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
} as Partial<Record<keyof DB, any>>

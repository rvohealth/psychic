import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type SpeciesTypesEnum = "cat" | "noncat";
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
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  species: SpeciesTypesEnum | null;
  updatedAt: Timestamp;
  userId: number;
}

export interface Users {
  createdAt: Generated<Timestamp>;
  email: string;
  id: Generated<number>;
  name: string | null;
  passwordDigest: string;
  updatedAt: Generated<Timestamp>;
}

export interface DB {
  health_users: HealthUsers;
  pets: Pets;
  users: Users;
}


export const HealthUserColumns = ['createdAt', 'email', 'id', 'name', 'passwordDigest', 'updatedAt']
export const PetColumns = ['createdAt', 'id', 'name', 'species', 'updatedAt', 'userId']
export const UserColumns = ['createdAt', 'email', 'id', 'name', 'passwordDigest', 'updatedAt']

export interface HealthUserAttributes {
  createdAt: DateTime
  email: string | null
  id: number
  name: string | null
  passwordDigest: string | null
  updatedAt: DateTime
}  

export interface PetAttributes {
  createdAt: DateTime
  id: IdType
  name: string | null
  species: SpeciesTypesEnum | null
  updatedAt: DateTime
  userId: number
}  

export interface UserAttributes {
  createdAt: DateTime
  email: string
  id: number
  name: string | null
  passwordDigest: string
  updatedAt: DateTime
}  


export const HealthUsersDBTypeMap = {
  createdAt: 'timestamp without time zone',
  email: 'character varying',
  id: 'integer',
  name: 'character varying',
  passwordDigest: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const PetsDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  name: 'character varying',
  species: 'species_types_enum',
  updatedAt: 'timestamp without time zone',
  userId: 'integer'
}

export const UsersDBTypeMap = {
  createdAt: 'timestamp without time zone',
  email: 'character varying',
  id: 'integer',
  name: 'character varying',
  passwordDigest: 'character varying',
  updatedAt: 'timestamp without time zone'
}



export class DBClass {
  health_users: HealthUsers
  pets: Pets
  users: Users
}

export interface InterpretedDB {
  health_users: HealthUserAttributes,
  pets: PetAttributes,
  users: UserAttributes
}

export class InterpretedDBClass {
  health_users: HealthUserAttributes
  pets: PetAttributes
  users: UserAttributes
}

export const DBColumns = {
  health_users: HealthUserColumns,
  pets: PetColumns,
  users: UserColumns
}

export const DBTypeCache = {
  health_users: HealthUsersDBTypeMap,
  pets: PetsDBTypeMap,
  users: UsersDBTypeMap
} as Partial<Record<keyof DB, any>>

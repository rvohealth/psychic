
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<DateTime>;

export interface Users {
  id: Generated<number>;
  name: string | null;
  type: string | null;
  email: string;
  password: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface DB {
  users: Users;
}


export interface UserOpts {
  id?:  Generated<number>;
  name?:  string | null;
  type?:  string | null;
  email?:  string;
  password?:  string;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 


export const UserColumns = ['id', 'name', 'type', 'email', 'password', 'created_at', 'updated_at']

export interface DBOpts {
  users: UserOpts
}

export const DBColumns = {
  users: UserColumns
}

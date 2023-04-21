
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<DateTime>;

export interface Howyadoins {
  id: Generated<number>;
  content: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
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
  howyadoins: Howyadoins;
  users: Users;
}


export const HowyadoinColumns = ['id', 'content', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at']

export const DBColumns = {
  howyadoins: HowyadoinColumns,
  users: UserColumns
}

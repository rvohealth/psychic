
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<DateTime>;

export interface HealthUsers {
  id: Generated<number>;
  email: string | null;
  password_digest: string | null;
  name: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface HelloWorldHowAreYous {
  id: Generated<number>;
  name: string | null;
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
  hello_world_how_are_yous: HelloWorldHowAreYous;
  users: Users;
}


export const HealthUserColumns = ['id', 'email', 'password_digest', 'name', 'created_at', 'updated_at']
export const HelloWorldHowAreYousColumns = ['id', 'name', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at']

export const DBColumns = {
  health_users: HealthUserColumns,
  hello_world_how_are_yous: HelloWorldHowAreYousColumns,
  users: UserColumns
}

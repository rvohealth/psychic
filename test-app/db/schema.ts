import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

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


export const AllColumns = ['createdAt', 'email', 'healthUsers', 'id', 'name', 'passwordDigest', 'pets', 'species', 'updatedAt', 'userId', 'users'] as const

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
        dbType: 'integer',
        allowNull: false,
      },
      email: {
        coercedType: {} as string | null,
        dbType: 'character varying',
        allowNull: true,
      },
      passwordDigest: {
        coercedType: {} as string | null,
        dbType: 'character varying',
        allowNull: true,
      },
      name: {
        coercedType: {} as string | null,
        dbType: 'character varying',
        allowNull: true,
      },
      createdAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
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
        dbType: 'bigint',
        allowNull: false,
      },
      userId: {
        coercedType: {} as number,
        dbType: 'integer',
        allowNull: false,
      },
      name: {
        coercedType: {} as string | null,
        dbType: 'character varying',
        allowNull: true,
      },
      species: {
        coercedType: {} as SpeciesTypesEnum | null,
        dbType: 'species_types_enum',
        allowNull: true,
      },
      createdAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
    },
  },
  users: {
    columns: {
      id: {
        coercedType: {} as number,
        dbType: 'integer',
        allowNull: false,
      },
      name: {
        coercedType: {} as string | null,
        dbType: 'character varying',
        allowNull: true,
      },
      email: {
        coercedType: {} as string,
        dbType: 'character varying',
        allowNull: false,
      },
      passwordDigest: {
        coercedType: {} as string,
        dbType: 'character varying',
        allowNull: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        dbType: 'timestamp without time zone',
        allowNull: false,
      },
    },
    virtualColumns: ['password'],
    associations: {
      pets: {
        type: 'HasMany',
        tables: ['pets'],
        optional: null,
      },
    },
  },
} as const

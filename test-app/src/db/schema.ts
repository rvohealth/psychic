import { CalendarDate } from '@rvohealth/dream'
import { DateTime } from 'luxon'
import {
  IdType,
  Json,
  PetTreatsEnum,
  PetTreatsEnumValues,
  SpeciesTypesEnum,
  SpeciesTypesEnumValues
} from './sync'

export const schema = {
  comments: {
    primaryKey: 'id',
    createdAtField: 'createdAt',
    updatedAtField: 'updatedAt',
    deletedAtField: 'deletedAt',
    serializerKeys: ['default', 'summary'],
    scopes: {
      default: [],
      named: [],
    },
    columns: {
      body: {
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
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      postId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
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
      post: {
        type: 'BelongsTo',
        foreignKey: 'postId',
        tables: ['posts'],
        optional: false,
        requiredWhereClauses: null,
      },
    },
  },
  health_users: {
    primaryKey: 'id',
    createdAtField: 'createdAt',
    updatedAtField: 'updatedAt',
    deletedAtField: 'deletedAt',
    serializerKeys: [],
    scopes: {
      default: [],
      named: [],
    },
    columns: {
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
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
      passwordDigest: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
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
    primaryKey: 'id',
    createdAtField: 'createdAt',
    updatedAtField: 'updatedAt',
    deletedAtField: 'deletedAt',
    serializerKeys: ['additional', 'default', 'summary', 'withAssociation'],
    scopes: {
      default: [],
      named: [],
    },
    columns: {
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
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      favoriteTreats: {
        coercedType: {} as PetTreatsEnum[] | null,
        enumType: {} as PetTreatsEnum,
        enumValues: PetTreatsEnumValues,
        dbType: 'pet_treats_enum[]',
        allowNull: true,
        isArray: true,
      },
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
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
      lastSeenAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
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
      likesWalks: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
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
        dbType: 'numeric',
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
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
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
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        foreignKey: 'userId',
        tables: ['users'],
        optional: false,
        requiredWhereClauses: null,
      },
    },
  },
  posts: {
    primaryKey: 'id',
    createdAtField: 'createdAt',
    updatedAtField: 'updatedAt',
    deletedAtField: 'deletedAt',
    serializerKeys: ['default', 'summary', 'withComments', 'withRecentComment'],
    scopes: {
      default: [],
      named: [],
    },
    columns: {
      body: {
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
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
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
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      comments: {
        type: 'HasMany',
        foreignKey: 'postId',
        tables: ['comments'],
        optional: null,
        requiredWhereClauses: null,
      },
      recentComment: {
        type: 'HasOne',
        foreignKey: 'postId',
        tables: ['comments'],
        optional: null,
        requiredWhereClauses: null,
      },
      user: {
        type: 'BelongsTo',
        foreignKey: 'userId',
        tables: ['users'],
        optional: false,
        requiredWhereClauses: null,
      },
    },
  },
  users: {
    primaryKey: 'id',
    createdAtField: 'createdAt',
    updatedAtField: 'updatedAt',
    deletedAtField: 'deletedAt',
    serializerKeys: ['default', 'extra', 'summary', 'withPosts', 'withRecentPost'],
    scopes: {
      default: [],
      named: [],
    },
    columns: {
      bio: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: false,
        isArray: false,
      },
      birthdate: {
        coercedType: {} as CalendarDate | null,
        enumType: null,
        enumValues: null,
        dbType: 'date',
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
      createdOn: {
        coercedType: {} as CalendarDate,
        enumType: null,
        enumValues: null,
        dbType: 'date',
        allowNull: false,
        isArray: false,
      },
      email: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      favoriteBigint: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      favoriteBigints: {
        coercedType: {} as IdType[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint[]',
        allowNull: true,
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
      favoriteCitext: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'citext',
        allowNull: true,
        isArray: false,
      },
      favoriteCitexts: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'citext[]',
        allowNull: true,
        isArray: true,
      },
      favoriteDates: {
        coercedType: {} as CalendarDate[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'date[]',
        allowNull: true,
        isArray: true,
      },
      favoriteDatetimes: {
        coercedType: {} as DateTime[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone[]',
        allowNull: true,
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
      favoriteJsonbs: {
        coercedType: {} as Json[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb[]',
        allowNull: true,
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
      favoriteNumerics: {
        coercedType: {} as number[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'numeric[]',
        allowNull: true,
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
      favoriteUuids: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'uuid[]',
        allowNull: true,
        isArray: true,
      },
      id: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
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
      jsonbData: {
        coercedType: {} as Json | null,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb',
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
      nicknames: {
        coercedType: {} as string[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying[]',
        allowNull: true,
        isArray: true,
      },
      notes: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
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
      passwordDigest: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      requiredFavoriteBigint: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      requiredFavoriteBigints: {
        coercedType: {} as IdType[],
        enumType: null,
        enumValues: null,
        dbType: 'bigint[]',
        allowNull: false,
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
      requiredFavoriteCitext: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'citext',
        allowNull: false,
        isArray: false,
      },
      requiredFavoriteCitexts: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'citext[]',
        allowNull: false,
        isArray: true,
      },
      requiredFavoriteDates: {
        coercedType: {} as CalendarDate[],
        enumType: null,
        enumValues: null,
        dbType: 'date[]',
        allowNull: false,
        isArray: true,
      },
      requiredFavoriteDatetimes: {
        coercedType: {} as DateTime[],
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone[]',
        allowNull: false,
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
      requiredFavoriteJsonbs: {
        coercedType: {} as Json[],
        enumType: null,
        enumValues: null,
        dbType: 'jsonb[]',
        allowNull: false,
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
      requiredFavoriteNumerics: {
        coercedType: {} as number[],
        enumType: null,
        enumValues: null,
        dbType: 'numeric[]',
        allowNull: false,
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
      requiredFavoriteUuids: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'uuid[]',
        allowNull: false,
        isArray: true,
      },
      requiredJsonData: {
        coercedType: {} as Json,
        enumType: null,
        enumValues: null,
        dbType: 'json',
        allowNull: false,
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
      requiredNicknames: {
        coercedType: {} as string[],
        enumType: null,
        enumValues: null,
        dbType: 'character varying[]',
        allowNull: false,
        isArray: true,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
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
    },
    virtualColumns: ['openapiVirtualSpecTest', 'openapiVirtualSpecTest2', 'password'],
    associations: {
      pets: {
        type: 'HasMany',
        foreignKey: 'userId',
        tables: ['pets'],
        optional: null,
        requiredWhereClauses: null,
      },
      posts: {
        type: 'HasMany',
        foreignKey: 'userId',
        tables: ['posts'],
        optional: null,
        requiredWhereClauses: null,
      },
      recentPost: {
        type: 'HasOne',
        foreignKey: 'userId',
        tables: ['posts'],
        optional: null,
        requiredWhereClauses: null,
      },
    },
  },
} as const

export const globalSchema = {
  passthroughColumns: [],
  allDefaultScopeNames: [],
  globalNames: {
    models: {
      'Comment': 'comments',
      'Health/User': 'health_users',
      'Pet': 'pets',
      'Post': 'posts',
      'User': 'users'
    },
    serializers: [
      'Admin/PetSerializer',
      'Admin/PetSummarySerializer',
      'Admin/UserSerializer',
      'Admin/UserSummarySerializer',
      'Admin/V2/AdminV2PetSummarySerializer',
      'Admin/V2/PetSerializer',
      'Circular/HelloSerializer',
      'Circular/WorldSerializer',
      'CommentSerializer',
      'CommentSummarySerializer',
      'CommentTestingAdditionalPropertiesSerializer',
      'CommentTestingAdditionalPropertiesShorthandSerializer',
      'CommentTestingArrayWithSerializerRefSerializer',
      'CommentTestingBasicArraySerializerRefSerializer',
      'CommentTestingBasicSerializerRefSerializer',
      'CommentTestingDateSerializer',
      'CommentTestingDateTimeSerializer',
      'CommentTestingDecimalSerializer',
      'CommentTestingDecimalShorthandSerializer',
      'CommentTestingDefaultObjectFieldsSerializer',
      'CommentTestingDoubleArrayShorthandSerializer',
      'CommentTestingDoubleSerializer',
      'CommentTestingDoubleShorthandSerializer',
      'CommentTestingIntegerSerializer',
      'CommentTestingIntegerShorthandSerializer',
      'CommentTestingObjectWithSerializerRefSerializer',
      'CommentTestingRootSerializerRefSerializer',
      'CommentTestingStringArraySerializer',
      'CommentTestingStringArrayShorthandSerializer',
      'CommentTestingStringSerializer',
      'CommentTestingStringShorthandSerializer',
      'CommentWithAllOfArraySerializer',
      'CommentWithAllOfObjectSerializer',
      'CommentWithAnyOfArraySerializer',
      'CommentWithAnyOfObjectSerializer',
      'CommentWithFlattenedUserSerializer',
      'CommentWithOneOfArraySerializer',
      'CommentWithOneOfObjectSerializer',
      'PetAdditionalSerializer',
      'PetSerializer',
      'PetSummarySerializer',
      'PetWithAssociationSerializer',
      'PostSerializer',
      'PostSummarySerializer',
      'PostWithCommentsSerializer',
      'PostWithRecentCommentSerializer',
      'UserExtraSerializer',
      'UserSerializer',
      'UserSummarySerializer',
      'UserWithPostsMultiType2Serializer',
      'UserWithPostsSerializer',
      'UserWithRecentPostSerializer'
    ],
  },
} as const

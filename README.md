# Psychic

Psychic is a typescript first Node framework built on top of [kysely](NEED_LINK) and heavily inspired by Ruby on Rails. It provides a light-weight routing layer around expressjs to create a familiar MVC pattern for those coming from a conventional MVC framework, a type-safe ORM with an incredibly powerful autocomplete API, elegant redis and socket.io bindings for distributed websocket applications, the ability to couple with a front-end framework (like react, angular, etc...) and write specs that drive through your frontend, while still maintaining a backend-centric context from which to write specs.

For more comprehensive documentation, please see [The official Psychic guides](NEED_LINK), and for a more low-level view of our codebase, see [Our API docs](NEED_LINK).

## Table of contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [extending express](#adding-express-middleware)
- [Routing](#routing)
  - [standard http routes](#standard-http-routes)
  - [namespacing](#namespacing)
  - [resourceful routing](#resourceful-routing)
- [Controllers](#controllers)
  - [request](#request)
  - [params](#params)
  - [response](#response)
- [Dream ORM](#dream)
  - [generating a dream class](#generating-a-dream-class)
  - [creating a new dream](#creating-a-new-dream)
  - [updating a dream](#updating-a-dream)
  - [dirty attributes](#dirty-attributes)
  - [querying](#querying)
    - [where](#where)
    - [limit](#limit)
    - [order](#order)
    - [joins](#joins)
    - [includes](#includes)
    - [nested queries](#nested-queries)
  - [associations](#associations)
    - [belongs to](#belongs-to)
    - [has one](#has-one)
    - [has many](#has-many)
    - [has one through](#has-one-through)
    - [has many through](#has-many-through)
    - [load](#load)
    - [polymorphism](#polymorphism)
  - [hooks](#hooks)
    - [before create](#before-create)
    - [before update](#before-update)
    - [before save](#before-save)
    - [before destroy](#before-destroy)
    - [after create](#after-create)
    - [after update](#after-update)
    - [after save](#after-save)
    - [after destroy](#after-destroy)
  - [STI](#sti)
- [Frontend](#frontend)
- [REPL](#repl)
- [CLI](#cli)
  - [create your database](#create-your-database)
  - [creating a new psychic app](#create-a-new-psychic-app)
  - [creating a new model](#create-a-new-model)
  - [run a migration](#run-a-migration)
  - [drop your database](#drop-your-database)
  - [TODO: rollback your database](#rollback-your-database)
  - [sync](#syncing-types-with-the-framework)
- [Testing](#testing)
  - [truncation](#truncation)
  - [setup](#setup)
  - [feature specs](#feature-specs)
  - [unit specs](#unit-specs)

# After `yarn install`

```bash
yarn build-core
```

To reset the database when devloping psychic:

```bash
NODE_ENV=test yarn psycore db:reset
```

To run specs:

```bash
NODE_ENV=test yarn uspec
NODE_ENV=test yarn fspec
```

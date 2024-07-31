# Psychic

testing

Psychic is a typescript first Node framework built on top of [kysely](NEED_LINK) and heavily inspired by Ruby on Rails. It provides a light-weight routing layer around expressjs to create a familiar MVC pattern for those coming from a conventional MVC framework, a type-safe ORM with an incredibly powerful autocomplete API, elegant redis and socket.io bindings for distributed websocket applications, the ability to couple with a front-end framework (like react, angular, etc...) and write specs that drive through your frontend, while still maintaining a backend-centric context from which to write specs.

For more comprehensive documentation, please see [The official Psychic guides](NEED_LINK), and for a more low-level view of our codebase, see [Our API docs](NEED_LINK).

To reset the database when devloping psychic:

```bash
NODE_ENV=test yarn psycore db:reset
```

To run specs:

```bash
NODE_ENV=test yarn uspec
NODE_ENV=test yarn fspec
```

## Global CLI

The global CLI is used to build a new psychic app. You can access the global cli on your machine by doing the following:

```bash
yarn global add @rvohealth/psychic
```

Once installed globally, you can access the global cli like so:

```bash
psy new myapp --redis --ws --primaryKey bigserial --client react
```

All files for maintaining this can be found in the `global-cli` folder at the project root. If any of these files are edited, those edits will not persist until you run `yarn build:global-cli`, since the `bin` field in package.json only supports javascript files.

Once that is done and the code is published using `yarn publish`, you can test the global cli on your local machine like so:

```bash
# if you already have it installed, remove it first
yarn global remove @rvohealth/psychic

# replace "1.1.1" with the version you have published
yarn global add @rvohealth/psychic@1.1.1
```

To test generating a new app without publishing, you can run the following from within the psychic directory:

```bash
yarn gpsycore new myapp --redis --ws --primaryKey bigserial --client react
```

NOTE: doing so will create the new app in the psychic folder, so once done testing remember to remove it.

# Psychic

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

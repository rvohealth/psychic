# psychic

## Up and running

### Add zshell shortcuts
```
alias psy="yarn run psy"
alias trance="yarn run trance"
```

### Clone repo and get going
```sh
cd ~/Sites
git clone https://github.com/avocadojesus/psychic
cd Sites/psychic

yarn install

psy new:app tuttles

# add env vars for twilio, google auth, etc here. Sample config provided by Fred, since it will
# have api keys for actual accounts with google, twilio, etc...
vim ./.env.development
```

### Starting Psychic Server
```sh
cd ~/Sites/tuttles
psy gaze
```

### CLI
```sh
cd ~/Sites/tuttles
trance
```


## API

## Core CLI (for operating core library)
## CLI
[x] psy app:new app_name (--db=[postgres,sqlite,mysql,mongodb])
[x] psy db:create
[x] psy db:migrate
[x] psy db:rollback
[x] psy spec
[x] psy generate:migration migration_name
[x] psy generate:dream dream_name
[x] psy generate:channel channel_name
[x] psy generate:projection projection_name
[ ] psy generate:js

## Channels (Controllers)
[x] #json
[x] #authenticates
[x] #emit
[x] #project

## Crystal Ball (Routing)
[x] #namespace
[x] #get
[x] #delete
[x] #post
[x] #put
[x] #patch
[x] #options
[x] #auth
[x] #given
[x] #resource
[x] #ws

### CrystalBall::Namespace
[x] #auth
[x] #addRouteForChannel
[x] #get
[x] #delete
[x] #given
[x] #namespace
[x] #post
[x] #put
[x] #patch
[x] #options
[x] #resource
[x] #run
[x] #ws

## Visions
[x] #json

## DB
[x] #addColumn
[x] #create
[x] #changeDefault
[x] #columnInfo
[x] #count
[x] #createTable
[x] #delete
[x] #drop
[x] #dropColumn
[x] #dropTable
[x] #dropAllTables
[x] #hasColumn
[x] #insert
[x] #renameColumn
[x] #renameTable
[x] #select
[x] #tableExists
[x] #transaction
[x] #update

## Postgres Adapter
[x] #addColumn
[x] #changeDefault
[x] #columnInfo
[x] #count
[x] #createDB
[x] #createTable
[x] #delete
[x] #drop
[x] #dropColumn
[x] #dropTable
[x] #dropAllTables
[x] #hasColumn
[x] #insert
[x] #renameColumn
[x] #renameTable
[x] #select
[x] #tableExists
[x] #transaction
[x] #update

### Queries
> Note: These are not currently unit-tested, but have spec coverage through postgres adapter specs.
[x] #all
[ ] #do
[x] #count
[x] #delete
[ ] #first
[x] #fetch
[x] #from
[ ] #fullOuterJoin
[x] #group
[x] #having
[x] #join
[x] #leftOuterJoin
[x] #order
[x] #limit
[ ] #offset
[x] #rightOuterJoin
[x] #select
[x] #update
[ ] #valueFor
[x] #where

## Dreams (ORM)
[x] .all
[x] .count
[x] .create
[x] .find
[x] .findBy
[x] .first
[x] .select
[x] .where
[x] #afterCreate
[x] #afterDestroy
[x] #afterSave
[x] #afterUpdate
[x] #authenticate
[x] #authenticateAll
[x] #authenticateFor
[x] #authenticates
[x] #authTokenFor
[x] #beforeCreate
[x] #beforeDestroy
[x] #beforeSave
[x] #beforeUpdate
[x] #belongsTo
[x] #emitsTo
[x] #emit
[x] #destroy
[x] #hasOne
[x] #hasMany
[x] #save
[x] #attribute
[x] #hasUnsavedAttribute
[x] #setAttributes
[ ] #update
[ ] #validates

## ESP
[ ] #transmit
[ ] #on
[ ] #listenersFor

## Helpers
[ ] #camelCase
[ ] #capitalize
[ ] #fileExists
[ ] #loadYaml

## L
## Messages

## Migrations
[x] #run
[x] #rollback

## Projections
## Spawns
## Telekinesis

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
[ ] #emit
[ ] #project

## Crystal Ball (Routing)
[ ] #namespace
[ ] #get
[ ] #delete
[ ] #post
[ ] #put
[ ] #patch
[ ] #options
[ ] #auth
[ ] #given
[ ] #resource
[ ] #ws

## Visions
[ ] #json

## DB
[ ] #addColumn
[ ] #create
[ ] #changeDefault
[ ] #columnInfo
[ ] #count
[ ] #createTable
[ ] #createTable
[ ] #delete
[ ] #drop
[ ] #dropColumn
[ ] #dropTable
[ ] #dropAllTables
[ ] #hasColumn
[ ] #insert
[ ] #renameColumn
[ ] #renameTable
[ ] #select
[ ] #tableExists
[ ] #transaction
[ ] #update

### Queries
[ ] #all
[ ] #count
[ ] #do
[ ] #count
[ ] #delete
[ ] #first
[ ] #fetch
[ ] #from
[ ] #fullOuterJoin
[ ] #group
[ ] #having
[ ] #join
[ ] #leftOuterJoin
[ ] #order
[ ] #limit
[ ] #offset
[ ] #rightOuterJoin
[ ] #select
[ ] #update
[ ] #valueFor
[ ] #where

## Dreams (ORM)
[ ] .all
[ ] .count
[ ] .create
[ ] .find
[ ] .findBy
[ ] .first
[ ] .select
[ ] .where
[ ] #afterCreate
[ ] #afterDestroy
[ ] #afterSave
[ ] #afterUpdate
[ ] #authenticate
[ ] #authenticateAll
[ ] #authenticateFor
[ ] #authenticates
[ ] #authTokenFor
[ ] #beforeCreate
[ ] #beforeDestroy
[ ] #beforeSave
[ ] #beforeUpdate
[ ] #belongsTo
[ ] #emitsTo
[ ] #emit
[ ] #destroy
[ ] #hasOne
[ ] #hasMany
[ ] #save
[ ] #attribute
[ ] #hasUnsavedAttribute
[ ] #setAttributes
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

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

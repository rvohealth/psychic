import fs from 'fs'
import packageMigrations from './packageMigrations'
import packageDreams from './packageDreams'
import packageChannels from './packageChannels'
import packageProjections from './packageProjections'
import packageREPL from './packageREPL'

if (!fs.existsSync('app/pkg'))
  fs.mkdirSync('app/pkg')

packageMigrations()
packageDreams()
packageChannels()
packageProjections()
packageREPL()


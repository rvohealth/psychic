import packageMigrations from './packageMigrations'
import packageDreams from './packageDreams'
import packageChannels from './packageChannels'
import packageProjections from './packageProjections'
import packageREPL from './packageREPL'

packageMigrations('dist/testapp/', 'spec/support/testapp/')
packageDreams('dist/testapp/', 'spec/support/testapp/')
packageChannels('dist/testapp/', 'spec/support/testapp/')
packageProjections('dist/testapp/', 'spec/support/testapp/')
packageREPL('dist/testapp/', 'spec/support/testapp/')

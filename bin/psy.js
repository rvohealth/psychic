var child_process = require('child_process')
var spawn = child_process.spawn

spawn('yarn run psy', [], { shell: true, stdio: 'inherit' })

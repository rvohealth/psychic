#!/usr/bin/env node

var child_process = require('child_process')
var spawn = child_process.spawn

spawn('yarn run psy', process.argv, { shell: true, stdio: 'inherit' })

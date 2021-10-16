#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
console.log("GDHJSGDJHSGDJSGDHGSHJDGSJHGDHJSGDJHSGDHJSGDJGHS", path.resolve(__dirname, '../../'), process.argv.join(' '))
// spawn(`cd ${path.resolve(__dirname, '../../')} && yarn run psy ${process.argv.join(' ')}`, [], { shell: true, stdio: 'inherit' })

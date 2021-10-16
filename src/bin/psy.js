#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
console.log(
  "GDHJSGDJHSGDJSGDHGSHJDGSJHGDHJSGDJHSGDHJSGDJGHS",
  process.argv,
  process.argv.slice(2)
)
spawn(`cd ${path.resolve(__dirname, '../../')} && yarn run psy ${process.argv.slice(2).join(' ')}`, [], { shell: true, stdio: 'inherit' })
